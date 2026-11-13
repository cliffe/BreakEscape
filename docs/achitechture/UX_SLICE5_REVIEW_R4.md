Counts: blockers 0, majors 0, minors 1, nits 4

# UX feedback round, slice 5 (speech bubble barks): code and UX review, round 4

Branch `build/ux-barks` at `06b0432a5`. Reviewed the R3 fixes (eb6be6e50, dd95210c2, 06b0432a5), `UX_SLICE5_REVIEW_R3.md` and the "R3 fixes" section of `UX_SLICE5_BUILD_LOG.md`, against the pixel-art UI rule, the UI design language notes and the spoken-lines rule.

## What was checked

**R3 findings.**
- m1 (lost hint): fixed for the paths R3 named. Stale, `close()`, `closeTagged` with another hint and with none, a dark room and a replacing line on the line page each show the hint once, live at 1400x1000 and 915x412. Two paths still double it when her bubble is on the last hint page (m1 below).
- m2 (under the lighting): fixed. Bubble depth 100003 live; the only object between the old depth (5001) and the new one is the light map itself (100000). Above the bubbles: the talk icon (100012), the NFC waves and the pooled damage texts (100020, hidden) and the screen flash (100110). The fill was not re-sampled; R3's builder sample was pure #FFFFFF.
- n3 (balanced pages): fixed, seen live: the store B hint pages as "Store B needs a staff / badge. Reception" and "issues them to visitors / with an escort.", 7 and 7 words.
- n4 (knot-bark preload): works; see the preload section and n3 below.
- n1 (resize), n2 (keep-outs), n5 (held bubbles first): read in code and in the R3 tests; not re-run live this round. The R3 builder's live numbers (0 frames over the Objectives panel after a resize; no unlisted fixed element) stand.

**Hint hand-on, every path, live** (driver `slice5_r4_hint.mjs`; a per-frame recorder counts each time either half of the hint comes into view, by source: bubble page, toast or notification; A is "Store B needs a staff badge. Reception", B is "issues them to visitors with an escort."). Same results at 1400x1000 (game 2644) and 915x412 (2646):

| Path | A | B | Seen as |
|---|---|---|---|
| Refusal in her 4 s cooldown, line page up (`superseded`) | 1 | 1 | notification only; bubble closed quietly |
| Same, first hint page up | 2 | 1 | A in bubble, then the notification (a second refusal restating it: fine) |
| Same, last hint page up | 1 | 3 | B in bubble, notification with A and B, and a toast "Dana Price: issues them to visitors with an escort." (m1) |
| Her next refusal after the cooldown, last hint page up (`replaced`) | 1 | 3 | new bubble pages: line, "issues them to visitors / with an escort. Store B / needs a staff badge.", "Reception issues them to / visitors with an escort." (m1) |
| Same, first hint page up | 2 | 1 | the hint once in the new bubble (fine) |
| Another line of hers, last hint page up | 0 | 1 | the unread half after her new line (fine) |
| `stillValid` false, line page | 1 | 1 | toast with the whole hint |
| `stillValid` false, last hint page | 0 | 1 to 2 | a mid-sentence toast (n1) |
| `close()` | 1 | 1 | toast |
| `closeTagged` with another hint | 1 | 1 | toast |
| `closeTagged` with no hint | 1 | 1 | toast |
| Room switched off with the bubble up | 1 | 1 | `left-view`: line and hint as one toast |

The superseded path the builder could not drive: the refusal inside the cooldown was staged by refusing again 0.8 s after the first, and by forcing her bubble onto a hint page and refusing within 0.3 s. Nobody calls the bubble handle's `close()` in the engine (only tests), so that path is theoretical.

**Depth.** Placement ghost, carried items, KO stars and interaction highlights:
- The proximity ghost (`interactions.js:520`, 9000) is now under the bubbles. It is a 20% tint over an object; it used to tint the bubble that covered it, so this is better.
- A carried item is drawn at its NPC's depth +/- 0.02 (`npc-office-visuals.js:173`), under the bubbles before and after.
- The KO stars are frames of the KO pose sprite, at the NPC's depth, under the bubbles before and after; nothing separate exists.
- The interaction highlight is a tint on the object itself. The press-to-talk and lock icons, health bars, influence pips and damage numbers use `overlayDepth`, LIGHT_DEPTH + 10 and up, so they stay above the bubbles when lighting is on.

With lighting off, `overlayDepth` returns the raw depth: the screen flash (10000) and the ghost sit under the bubbles (n2). Lighting is off in 116 of 207 scenarios, and players can turn it off. Live in test_phone_calls (no lighting, game 2674): bubble 100003, flash overlay 10000.

**Dark rooms.** A bubble never glows in the dark. Switching the hall off with Dana's bubble up hid it the same frame (`left-view`) and sent her line and hint to one toast; room level 0, no bubble shown; a new bark from Lee in the dark hall went to the toast (`lastRoute` toast). In a dim room above the dark threshold (0.5) the bubble is now pure white over the dimmed floor, which is what R3 m2 asked for: UI is not lit.

**Knot-bark preload (n4), counted live** (driver `slice5_r4_load.mjs`, 1400x1000):
- m02 (game 2649): 15 NPCs, 12 person, and none with a mapping that answers from a knot (every knot mapping opens a conversation, or has bark text). 0 preload GETs. The 7 ink GETs at load are the room loader's and the briefing's, as before. Ready at 8.7 s.
- sis01 (game 2657): 2 NPCs qualify (bed4_patient, bed2_patient): 2 preload GETs, both at 8.7 s, against ready at 8.8 s; each 100 to 150 ms. Both stories had already been fetched at 8.4 s by the room loader into its own cache, so these 2 GETs are duplicates (n3).
- test_bark_bubbles (2644): 0 preload GETs.
- No state: the preload writes only `npcManager.storyCache` and a map of promises keyed by story path, both bounded by the number of stories; no `inkEngineCache` entry is made at load (0 engines after load in all three games), so a conversation opened first still builds its engine through `getInkEngine` with the global-variable sync. Non-GET requests in the first 6 s were the usual 1 to 3 syncs. No slowdown seen: the preload is not awaited by registration and runs after the room loader's own fetches.

**The waiting chatter line** (driver `slice5_r4_chatter.mjs`, test_needs_sims, games 2647 at 1400x1000 and 800x600). Three one-off lines of 7 s set once, and a bark 2 s later; sampled every frame for 12 s. Grace's line waited the whole 7 s (299, 407 and 410 frames over three runs) and was never shown. It then expired: `getState().talking` became null for all three, and `says` stayed at 0. A waiting chatter line is not queued anywhere: `update()` asks the needs system each frame for the line it is saying now, and `_talking()` (npc-needs.js:3906) returns it only while `clockMs < until`. So the wait is bounded by the line's own time on screen; nothing grows (the bubble objects map stayed at 4, one per NPC that spoke, and the bubble log at 2). In the same runs: up to 3 bubbles, 0 frames with two overlapping, 0 outside the view, 0 under a HUD panel, 1 to 3 layout changes in 12 s. In the first 1400x1000 run Amara's bubble was shown for 42 frames and then hidden for the rest of her line (257 frames) when Sanjay's bark took the room (n4).

**User rules, last pass.**
- Pixel art and crisp: the bubbles in the new shots are 2 px dark border, flat white fill, whole-pixel pointer, VT323 at its pixel size, no smoothing seen. Pass.
- Never over another speaker's head or the HUD: 0 HUD frames and 0 overlaps in the chatter runs; the hard head keep-out is unchanged since R2. Pass.
- Every bark lands visibly somewhere: every hand-on path above showed the hint in a bubble, a toast or the notification; the dark-room bark went to a toast. Pass, with the doubles in m1. Chatter is not a bark, but see n4.
- Spoken text in scenario files: the R3 changes add no text of their own. The handed-on hint is the door's `lockedHint` from the scenario, shown silently (`useTTS: false`), as before. Pass.

**Regressions.**
- Phone calls (test_phone_calls, game 2674), with the scenario's guard conversation closed first: Basic rings, answering connects the call (`callActive`), a person bark during it is held (queue 1) and comes out as a bubble when the call ends, a phone contact's bark is a toast, `ring_voicemail` rings and a decline gives "New voicemail". Games 2648 and 2673 left the guard conversation open, so Basic stayed `queued`, as in R3's 2575; that is the scenario, not this slice.
- Chatter: as above.
- Door refusals: the first refusal with Dana in view is her bubble with no notification; in her cooldown, the notification.

**Tests.** Every test file importing a changed module or the modules R3 listed (`npc-world-bubbles`, `npc-barks`, `npc-manager`, `doors`, `core/game`, `npc-action-icons`, `interactions`, `locked-hint`), no lock: `bin/test-js -j 3` on 117 files, 117 passed, 0 failed.

**Live setup.** Keyless server on :3337 from this worktree, headless, `setFPS(20)` with fixed steps on, scrollbars shown (15 px probe). New games: 2644, 2645, 2646 (`test_bark_bubbles`), 2647 (`test_needs_sims`), 2648, 2673, 2674 (`test_phone_calls`), all from `swap-scenario-game.rb test_access_habits <dir>`; 2649 (m02) and 2657 (sis01) from `new-game.rb`. Shots and numbers in `scratchpad/ux-shots/slice5-r4/` (lossless webp: `big-hint-*`, `phone-hint-*`, `small-replace-last-hint-page-repeat`, `*-chatter-*`, `calls2-*`; `*-hint-report.json`, `*-load.json`, `*-chatter.json`, `small-probe.json`). Server stopped afterwards.

## Findings

### Blockers

None.

### Majors

None.

### Minors

**m1. With her bubble on the last hint page, a refusal in her cooldown or her next refusal shows the hint twice, and the bubble repeats half of it.**
`public/break_escape/js/systems/npc-world-bubbles.js:576` (`closeTagged`) and `npc-world-bubbles.js:613` (`say`). `followUpLeft` (npc-world-bubbles.js:310) returns the hint from the page on screen, so on the last hint page it is only the second half. Both compares then treat that half as a different hint from the full one the new answer carries:
- `closeTagged` hands it on as a toast next to the door's notification (B three times live: bubble, notification, toast "Dana Price: issues them to visitors with an escort.").
- `say()` puts the half in front of the full hint, so her new bubble reads "issues them to visitors with an escort. Store B needs a staff badge. Reception issues them to visitors with an escort.".

Live at 1400x1000 and 915x412 (cases `cooldownHintPage2` and `replaceByRefusalHintPage2`, shot `big-hint-cooldownHintPage2`, pages in `small-probe.json`). A player who tries the door again while reading the hint's end sees this.
Fix: count the unread part as the same hint when the new hint ends with it. In `closeTagged`: `handOn: !!left && !same.endsWith(key(left))`. In `say()`: `if (next && key(next).endsWith(key(carried))) carried = ''` before building `allFollow` (reuse the same `key()`, hoisted to module level). Tests: cooldown on the last hint page gives no toast; a second refusal on the last hint page gives the line and then the hint once.

### Nits

**n1.** A hint cut short on a later page is handed on mid-sentence: `stillValid` false on the last hint page gives the toast "Dana Price: issues them to visitors with an escort." (live, case `staleHintPage2`), which makes no sense without the first half. Cause: `followUpLeft` starts from the page on screen (`npc-world-bubbles.js:312`). Fix: when any of the follow-up is unread, hand on the whole follow-up, from `linePages`. The half read once shows again, but the toast reads as a sentence. With this, m1's fix becomes a plain whole-hint compare.

**n2.** With lighting off, the combat screen flash and the proximity ghost now draw under the bubbles. `BUBBLE_DEPTH` (`npc-world-bubbles.js:86`) is LIGHT_DEPTH + 3 in every game. `overlayDepth` (`utils/constants.js:19`) returns the raw depth when `window.lightingSystem` is null: the flash is at 10000 (`screen-effects.js:21`) and the ghost at 9000. Live in test_phone_calls (no lighting): bubble 100003, flash 10000. A hit's red flash leaves the bubbles sharp on top. Fix: give the flash a depth above the bubbles in both modes, `Math.max(overlayDepth(10000), LIGHT_DEPTH + 110)`, or make the bubble depth follow `overlayDepth` (`window.lightingSystem ? LIGHT_DEPTH + 3 : 9500`).

**n3.** The knot-bark preload fetches stories the room loader has just fetched. `_preloadKnotBark` (`npc-manager.js:878`) checks only `npcManager.storyCache`, but the room loader keeps its own cache (`npcLazyLoader.storyCache`, `npc-lazy-loader.js:169`) and registers the NPC after loading the story. Live, sis01: bed4_patient and bed2_patient are each fetched twice (8.4 s and 8.7 s); m02: no preloads at all. Fix: before the fetch, `const cached = window.npcLazyLoader?.getCachedStory?.(npc.storyPath); if (cached) { this.storyCache.set(npc.storyPath, cached); return; }`. Do the same in `_showBarkFromKnot` so a first bark without the preload does not fetch either.

**n4.** Chatter that finds no room is voiced with no bubble, and a chatter bubble on screen is dropped mid-line when a bark takes its place. The wait is bounded (the line expires at its `until`; nothing queues; see above). But `_showSaying` and the chat tick hand the line to `_speak` (`npc-needs.js:2077` and 3887) whether or not `update()` can place it (`npc-world-bubbles.js:771` to 777), so the player can hear Grace with nothing showing who spoke. Live, Amara's bubble went after 42 of 299 frames when Sanjay barked. Not a bark, so the "every bark lands" rule does not cover it; it is still a voice with no face. Fix options, for the orchestrator to pick:
- Place chatter already on screen (`held`) before a new bark's search, so the newcomer bark goes to its toast (barks always land).
- For an overheard, voiced chatter line that has had no place for 500 ms, show it once as a silent toast. That is bounded: one per line, and chatter lines are heard once.
- Accept it as the design: chatter is ambient.

## Sync

Display only, unchanged. Nothing is added to `player_state`, and the R3 fixes send nothing new; no non-GET request came from the bubbles. The preload is at most one GET per story with a person knot-bark mapping (0 in m02, 2 in sis01), read into the in-memory story cache, with a promise map bounded by the number of stories. The carried hint lives on one bubble's state. The bubble log is capped at 60 entries, and the bubble objects map holds one entry per NPC that has spoken. A waiting chatter line is held nowhere: it expires with its `until`.
