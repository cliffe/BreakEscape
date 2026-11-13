# UX slice 4 review, round 3 (merge of main, right-edge band fix)

Branch `build/ux-slice4` at f10453c25. Scope: only what came after the round 2 pass at 51497d1fa: merge b1eb68049 (main 2f5471209), fix 6c39c5481 and build log f10453c25 ("Finish, 2026-11-13" section). Code was read, not edited.

Verdict: pass. The merge is clean, the observer does what the log says with no loop or thrash, and rotation still rescales. No blocker or major findings. Three minor items, all fit for a follow-up.

## 1. Merge (b1eb68049)

Merge base dedfa3422. Main touched 89 files; two of them were also changed on this branch.

- For every file only main touched, the merge equals main (`git diff b1eb68049^2 b1eb68049 -- <file>` empty for all). For every file only this branch touched, the merge equals the branch. Nothing from either side is lost.
- `app/views/break_escape/games/show.html.erb`: the changed lines between main and the merge are exactly this branch's change (`class="pixel-scroll"` on `#inventory-container`, line 135), and the changed lines between the branch and the merge are exactly main's change. Both kept.
- `scenarios/lab_physical_pentest/scenario.json.erb`: the same two-way check holds (this branch's "Put on" wording, main's wedge additions). Validator `--no-graph`: 0 lines with ❌.

## 2. The ResizeObserver (6c39c5481, `public/break_escape/js/main.js:332-340`)

The cause in the log checks out. `show.html.erb:503-512` sets `body.style.minHeight = innerHeight + 1` on touch pages and clears it 700 ms later (200 + 500 ms). `body` is a flex row (`css/main.css:2-11`) and `#game-container` has `overflow: hidden` (`main.css:19`), so its automatic minimum width is 0 and it shrinks by the root scrollbar's width while the scrollbar shows. No window `resize` fires when it goes away.

Loop: none possible. The container is sized only by viewport units (`width: 100vw; height: 100dvh`, `main.css:16-18`), and the canvas is absolutely positioned inside an `overflow: hidden` box (`main.js:274`), so nothing `applyPixelPerfectScale` does can change the container's size. The callback only arms the existing 50 ms debounce (`main.js:311-314`), so it never writes layout inside the observer callback either: no "ResizeObserver loop" errors in any run.

Overlays and HUD: the container's size does not depend on any overlay, minigame, conversation or HUD element, and no other code sets its size (the only other reader, `person-chat-portraits.js:206`, reads `clientWidth`). Measured: opening and closing the pause menu and a notes minigame gave 0 observer callbacks and 0 rescales in every run; 3 s idle gave 0 and 0.

Lifetime: `initializeGame` runs once, on `DOMContentLoaded` (`main.js:459`). `window.initializeGame` is exported (`main.js:462`) but nothing calls it. A Phaser scene restart does not re-run it, so the observer is never duplicated. It is never disconnected, which is right for an element that lives as long as the page.

Live matrix (keyless server on :3431, game 3154 of test_wearable, scrollbars shown, headless shell, `isMobile: false`). Gap = container edge minus canvas edge, 2.5 s after the game is ready.

| Viewport | dpr | Touch | Scale | Gap right / bottom | Observer callbacks at boot | Rescales in idle / overlays |
|---|---|---|---|---|---|---|
| 1400x1000 | 1, 3 | no / yes | 2, 6 | 0 / 0 | 1 / 2 | 0 / 0 |
| 800x600 | 1, 3 | no / yes | 1, 4 | 0 / 0 | 1 / 2 | 0 / 0 |
| 915x412 | 1, 3 | no / yes | 1, 3 | 0 / 0 | 1 / 2 | 0 / 0 |
| 390x844 | 1, 3 | no / yes | 1, 2 | 0 / 0 | 1 / 2 | 0 / 0 |

Rotation: 390x844 to 844x390 and back, at dpr 1 and 3, touch and not: one rescale each way (for example `game 585x1266` then `1266x585` at dpr 3), container 844x390, gap 0 / 0, and 0 / 0 again after rotating back. The window `resize` and the observer both fire, and the shared debounce folds them into one call.

The one extra callback at boot is the observer's initial observation, which costs one redundant `applyPixelPerfectScale` (no `game.scale.resize`, since the size is unchanged). Harmless.

Probe script, results and shots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/slice4-r3/` (`probe.mjs`, `probe.jsonl`, `shots/`).

### m1 (minor): the band was on every touch viewport, not only 390x844, and the canvas still jumps once at boot

Every touch run first scaled to the narrowed container and then corrected: 1400x1000 `693x500` then `700x500`, 800x600 `785x600` then `800x600`, 915x412 `900x412` then `915x412`, 390x844@3 `563x1266` then `585x1266`. Before this fix every touch device with classic scrollbars (Windows touch laptops, Chromebooks with a mouse) would have kept the band, at any size. The observer fixes all of them, but the 700 ms scrollbar is still there (`show.html.erb:505`), so the view visibly snaps wider about 0.7 s after boot. The build log (f10453c25, "The 15 px band") describes only 390x844.

Fix: correct the log line. Optionally hide the root scrollbar while the URL-bar nudge runs, for example set `document.documentElement.style.scrollbarWidth = 'none'` beside line 505 and clear it with the min-height at line 510, so the container never narrows. `scrollTo` still works with a hidden scrollbar.

### m2 (minor): no repeatable test of the real path

No test under `test/` or `tools/playtest/` covers the observer or `applyPixelPerfectScale` (the only `ResizeObserver` stubs are in `lab-ux-ui.test.mjs:547` and `phone-chat-bottom-pin.test.mjs`, for other code). A jsdom unit test cannot see this bug, because it needs real layout and a classic scrollbar. The builder's before/after proof was manual.

Fix: check in a small headless check, for example `tools/playtest/canvas-cover-check.mjs`, modelled on this round's `probe.mjs`: Chromium launched with `ignoreDefaultArgs: ['--hide-scrollbars']`, viewport 390x844, `hasTouch: true`, `isMobile: false`. Wait for `__test.waitUntilReady` plus 1.5 s, then assert that the canvas rect covers `#game-container` (right and bottom gaps 0). Then `setViewportSize(844, 390)`, wait 1 s, assert again. It fails at 6c39c5481^ (gap 15) and passes at 6c39c5481. A one-line regression in `test/js` that `main.js` observes `#game-container` would add little.

## 3. Tray scrollbar (pixel-art rule)

The tray uses only the shared `.pixel-scroll` rule (`css/utilities.css:340-385`): 14 px, square thumb with a 2 px solid edge, no radius, no arrow buttons, and `scrollbar-width` / `scrollbar-color` left at `auto` so Chrome 121+ still applies the `::-webkit-scrollbar` rules. The old 8 px rounded tray rules are gone from `hud.css` and `inventory.css` (no `webkit-scrollbar` match in either). `ui-themes.css:730-732` adds the scrollbar's height back to the themed strip. The enlarged 390x844 eight-item shot from the builder shows a square, 2 px edged thumb. Passes.

### m3 (minor): the track's 2 px edge is on the wrong side for a horizontal strip

`.pixel-scroll::-webkit-scrollbar-track` draws `border-left: 2px solid` (`utilities.css:356`). That edge suits a vertical scrollbar. On the tray's horizontal scrollbar it becomes a 2 px stub at the strip's left end, under the thumb at rest, instead of a line along the top that separates the track from the slots. It does not break the rule, but it is inconsistent with how the vertical scrollbars look.

Fix: add `.pixel-scroll::-webkit-scrollbar-track:horizontal { border-left: 0; border-top: 2px solid var(--pixel-scroll-thumb); }` to `utilities.css`.

## Counts

Blocker 0, major 0, minor 3. Verdict: pass; merge ready from this round's side.
