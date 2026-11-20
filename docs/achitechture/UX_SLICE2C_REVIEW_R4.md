# UX slice 2c: review round 4

Branch `build/ux-slice2c`, diff `a8f74b3b8..HEAD`, focused on `4b641bb50..HEAD` (the round 3 fixes: `c96413436`, `9c1275bc1`, `df83bd790` and the build log). This was a read-only review of the code, the tests, the build log and the shots in the scratchpad's `ux-shots/slice2c-r3fix/`. Engine paths are under `public/break_escape/`. I took no live run of my own. I ran the touched test files and every file that imports a changed module, without the lock: 18 files, 335 tests, all passing (`pc-monitor-frame` 35, `password-signin-mode` 55, `container-shares` 43, `network-view` 43, `container-transfer-dialog` 14, `access-remote-signin` 15, `phone-intro-once-and-notepad-raw` 12, and the 11 text-file and container importers).

Labels: B blocker, M major, m minor.

## Round 3 findings

| R3 | Status | Evidence |
|---|---|---|
| M1 remote sign-in: two looks for panels and buttons | Fixed | `.pc-screen-area .signin-captured` is a solid `#101820` slab with a 2px `#2a3a48` edge (`css/password-minigame.css:1150-1166`), items get `pc-os-btn` (`password-minigame.js:1615`, `capturedListHtml`), labels are bordered (`:1169-1173`). remote-signin-captured-1400x1000 shows one slab look and one button look. The title sharing the items' line is a sensible fix for the x2 overflow. |
| M2 text viewer leaves the frame | Fixed (moved into this slice) | `pcScreen` hand-off, see below. textfile and share-file shots at four sizes show the same frame as the desktop or share. |
| m1 chosen account has no headshot | Fixed | `applySelectedHeadshot` (`password-minigame.js:1591-1607`); main-02 at 390x844 shows it. Shown at every size, which keeps one look; accept. |
| m2 two field colours | Fixed | `:1177-1183`, slate at rest and the OS accent on focus. |
| m3 Wi-Fi buttons without a border | Fixed | `:409-410`, `:617-618`; wifi-join shot. |
| m4 icon plate and green hover | Fixed | `css/container-minigame.css:898-912`; desktop-overflow-1400x1000 has no plate. |
| m5 source-text tests | Fixed | The viewport test is behavioural, the `currentCSSZoom` and cross-file regexes are gone, the fold and title are checked through computed styles. The R3 m2/m3/m4 test (`pc-monitor-frame.test.mjs:753-766`) still slices CSS by selector text and pins colours, but only for the rule each finding was about; acceptable. |
| m6 tidy-ups | Fixed | `utils/more-below.js`; the constant sits above the JSDoc (one stray blank line is left between the JSDoc and `evenShareLabels`, `container-minigame.js:240`); the PC screen no longer reveals the line it has just emptied (`password-minigame.js:1134-1137`). |

## The `pcScreen` hand-off

**Path.** `ContainerMinigame.pcScreenExtras()` (`container-minigame.js:1271-1273`) is spread onto the stand-in sprite on both click paths (`:1469`, `:1530`) and on the Copy / Move dialog's Open (`:1354`). `interactions.js:1864` hands the stand-in to the reader as `lockable`, and `pcScreenOf` (`text-file-minigame.js:31-35`) reads `params.pcScreen` or `params.lockable.pcScreen`. It is a clean route with no new globals.

**Does the X return to the right place?** Yes, for a plain open and close. The reader's cleanup is unchanged: a network screen reopens through its branch, and any other container through `cameFrom` and `returnToContainerAfterNotes`. Both were proven live at four sizes. After a Notepad round trip the answer changes (m1).

**Does a file read from the world keep the old viewer?** Yes. A world sprite has no `pcScreen`, so `pcScreenOf` returns null and `setupTextFileInterface` takes the old branch. The test at `pc-monitor-frame.test.mjs:808-813` covers it. The change from `document.getElementById('minigame-notebook')` to a query inside `gameContainer` is safe, because the old template puts that button inside the game container too (`:171`).

**Does anything leak when the viewer closes?** No. `cleanup()` clears the notify timer and calls `pcMonitor.destroy()` (removes `pc-view` and the resize listener) before `super.cleanup()`, which removes the listeners registered through the scene. The test checks that `pc-view` is gone. The inventory does not keep `pcScreen`: `addToInventory` builds its `img` from `scenarioData`, `name` and `objectId` only (`systems/inventory.js:838-850`, around `:845`), so a takeable file read from a desktop and then opened from the inventory gets the old viewer. `pcScreen` also rides on stand-ins for non-reader types (lock panels, phones, folders). Nothing else reads it, so it does no harm.

**Other items opened from a desktop that still leave the frame.**
- A readable note (`notes*`, `readable: true`) opens the full-window Notes viewer. In the shipped missions, PC contents hold text files almost everywhere: m01 7, m03 4, m06 3, m02/m05/m07 1 each. A note sits on a PC only in m04 and m06 (one each). Rated m5 below.
- Lock panels (a key-locked or password-locked folder or archive on a desktop) open in the old frame. The user's q98 decision keeps the plain 2px panel for archive and Wi-Fi prompts, so this is intended and not a finding.
- Images and phones: no mission PC holds one today. Nothing to rate.

## Findings

### m1. After Add to Notepad, the desktop comes back instead of the file, so the build log's claim is not true

`js/minigames/notes/notes-minigame.js:862-897`; `js/minigames/text-file/text-file-minigame.js:386-396`, `:513-524`. From reading the code, not a live run.

A reader opened from a desktop or share always runs with `window.pendingContainerReturn` set (the click paths and the dialog's Open set it). Add to Notepad sets `pendingTextFileReturn` and starts the Notes viewer, and the reader's cleanup leaves `pendingContainerReturn` alone. When the Notes viewer closes, both branches run. The container return fires first (`:862`) and reopens the desktop. The text-file return then sees `containerReturnBlocked` report `busy` (the desktop is now open) and drops itself (`:895`). The player lands on the desktop, so the `pcScreen` carried in `pendingTextFileReturn` is never used for a reader opened from a PC. The build log says "Back from the Notepad, the reader keeps its frame", but the live proof does not cover this step. The old viewer behaves the same way (it predates the slice), so landing on the desktop is not a regression. It is a wrong claim plus dead code.

Fix (pick one):
1. Return to the file, which is what the code now intends. In `notes-minigame.js:862`, skip the container branch when `window.pendingTextFileReturn` is set. The reader then comes back in its frame, and its own X spends `pendingContainerReturn` as usual. Also carry `itemId` in `textFileState` (`:386`) and pass it in `returnToTextFileAfterNotes` (`:514`), so `cameFrom` matches by id and not only by file name.
2. Or accept landing on the desktop. Drop `pcScreen` from `textFileState` and correct the build log.

I prefer 1, because it returns the player to the file they were working from. Test either way: jsdom with a desktop's `pendingContainerReturn` set, open the reader with `pcScreen`, call `addToNotebook()` with a stub `startNotesMinigame`, run the notes close branch, flush the timers, and assert which minigame is current (the reader in the frame for option 1).

### m2. Opening a file from a desktop removes the post-it and leaves the chin empty

`js/minigames/container/container-minigame.js:1271-1273` (`pcScreenExtras`), `:320-325` (`mountMonitor`); `text-file-minigame.js:65`. Compare textfile-msg-1400x1000 with desktop-overflow-1400x1000.

On the desktop the chin holds the post-it and its Add to Notepad button. Open "Mail" and the frame stays the same size, but the note and button vanish from the chin. The rule says things stuck to a device are placed relative to the frame, and the note is stuck to the monitor, not to the desktop view. There is also a sizing gap: with no note, the reader's chin uses the height kept for the current window size. If the window is resized while the reader is open, no height is kept for the new size, so the chin collapses and the frame no longer matches the desktop it returns to.

Fix: put `postitHtml` (the escaped note `mountMonitor` builds) into `pcScreenExtras()` when `this.desktopMode`. Have `pcScreenOf` keep it as a string, and pass it to `mountPcMonitor` in the reader with `makeDraggable` as the container does. The reader then measures its own note at any size. The share window has the same gap (`mountMonitor` passes a note only in `desktopMode`). Decide that once: if the note is on the monitor, a share opened on that monitor shows it too. Test: the frame box with the note equals the desktop's (drop the `"note":null` replacement in `pc-monitor-frame.test.mjs:775`).

### m3. The Copy / Move dialog lands on half pixels

`css/container-minigame.css:632-648` (`inset: 0; margin: auto; width: fit-content; height: fit-content`).

`margin: auto` splits the spare width and height evenly. When the window's width minus the dialog's is odd, the dialog sits half a CSS pixel off the grid. At x2 that is one screen pixel, so its 2px edges and the 2px button edges fall between the art's pixels (share-dialog-1400x1000: left edge at x 401). The same applies vertically, which the build log does not mention.

Fix: centre it in JS once it is laid out, as `evenShareLabels` does for the file names. After `host.appendChild(dialog)`, and again on `document.fonts.ready` and on resize through `this.addEventListener`, set `dialog.style.left = Math.floor((host.clientWidth - dialog.offsetWidth) / 2) + 'px'` and the same for `top`. Then drop `right`, `bottom` and `margin: auto` from the rule (keep `max-height`). Test: in jsdom with stubbed `clientWidth`/`offsetWidth` of odd difference, `left` is a whole number.

The dialog keeps Cancel and has no X. That matches the confirm-dialog exception (q99: named buttons, no X). Accept.

### m4. The reader's toolbar: drop Select All in the monitor and keep it the same for every file

`text-file-minigame.js:108-110`, `:247`.

The orchestrator's question was whether the toolbar should depend on the item type. My judgement is no, not on this evidence. The reader only ever opens `text_file` items. "Mail" is a fixture in `scenarios/test_access_signin/scenario.json.erb:36-42`, a text file named like an app, and the engine already has a real mail client for `type: "mail_terminal"` (`systems/interactions.js:1741`). Branching the toolbar on a display name would be guesswork, and adding an item type for app-like text files is a design call bigger than this slice.

The toolbar does have one weak button. Copy earns its place: VM missions have players carry strings out of the game, and it copies the whole file. Select All only highlights text that Copy already copies, and on a phone it is a second row of buttons (share-file-390x844). Fix: in `setupMonitorInterface`, render Copy and Add to Notepad only, guard the listener at `:247` with `if (this.selectAllBtn)`, and update the test list at `pc-monitor-frame.test.mjs:792`. Leave the old viewer as it is. For the fixture, rename "Mail" to something that reads as a file (for example "Mail export.txt"), or make it a `mail_terminal` if the test needs an app. Log a backlog line for an app-style `fileType` (icon and toolbar per `fileType`) in case authors start using text files as apps.

### m5. A readable note on a PC still opens the Notes viewer full window (follow-up slice)

`systems/interactions.js:1898-1950` (the `readable` branch); `container-minigame.js:1425-1470` (the takeable note path with `itemToTake`).

This is the same break as R3 M2, but for the two notes held on PCs in shipped missions (m04, m06), against text files on most mission PCs. Rate it m and put it in the backlog. It does not hold the merge. Fix in the next slice: when the stand-in carries `pcScreen` and the type is `notes*`, open the text-file reader in the frame with the note's text and observations, and keep the `itemToTake` take in `returnToContainerAfterNotes`, which the reader's cleanup already calls. Or give the Notes viewer a monitor mode. The first reuses this round's work.

### m6. The RFID screen's own "More below": move it with a shared cue helper, not on its own

`js/minigames/rfid/rfid-ui.js:29`; `js/utils/more-below.js`.

`more-below.js` holds one string. Moving `rfid-ui.js` onto it costs a harness edit in each RFID test that copies `rfid-ui.js` with an import rewrite map (`rfid-flipper-back`, `rfid-door-screen`, `rfid-crypto-contrast`, `rfid-dictionary-attack`, `rfid-no-keycards-hint`, and the bulk importers). That is too much churn for a string that has not drifted. The real duplication is the show-and-hide logic, which exists four times: the network view, the RFID display, the PC desktop and the infusion pump (`minigame-close-shell.test.mjs:197-242`), with the objectives panel close to it. Fix, in the backlog: grow `utils/more-below.js` into `watchMoreBelow(scene, scroller, cue)` (scroll and resize through `scene.addEventListener`, `hidden` toggled at the end), move all four to it, and add `utils/more-below.js` to each copy list in that one pass. The harness copy lists this round are complete: every test that loads the network view, the container or the text-file reader passes, and `phone-intro-once-and-notepad-raw` gained `pc-monitor.js` for the reader's new import.

### m7. The sign-in tiles are still see-through with a terminal-green selection

`css/password-minigame.css:781` (`background: rgba(0, 0, 0, 0.55)`), `:788-792` (`#00ff00`, `rgba(0, 80, 0, 0.6)`), `:798-801`. main-02-390x844 and main-01 at all sizes.

R3 M1 and m4 removed see-through fills and the old green from the remote screen and the desktop icons. The tiles on the same screen still have both: the mountain shows through every tile, and the chosen one has a bright green edge, while focus, hover and More below elsewhere in the OS use `#9ee6ff`. Slice 2b q92 changes which tiles show, not how they look, so this belongs here. Fix, inside the monitor only: `.pc-screen-area .signin-tile { background: #101820; border-color: #2a3a48; }`, `.pc-screen-area .signin-tile:hover, .pc-screen-area .signin-tile.selected { border-color: #9ee6ff; background: #1a2c3a; }`, `.pc-screen-area .signin-tile:disabled:not(.selected):hover { border-color: #2a3a48; background: #101820; }`. Leave the old frame's tiles alone. Test: the computed tile background in the monitor has no `rgba(`, as the captured-box test does (`pc-monitor-frame.test.mjs:740`).

## Other checks

- **Pixel art in the new rules.** The reader's monitor block has 2px edges, GNF at 16px, weight normal, no `translateY`, no `rgba`, and no radius (the test enforces this). The 16px title and toolbar icons are 16x16 at 1:1 (`assets/objects/text_file.png`, `assets/icons/notes.png`). The headshot box's `box-shadow: 0 0 0 2px` is a hard 2px edge with no blur, which is acceptable.
- **Regressions.** Every new rule is scoped to `.pc-monitor` or `.pc-screen-area`, except `.submit-btn` and `.hint-btn`, whose 2px border is wanted on archives and safes too. The old viewer's results still go through `showSuccess`/`showFailure` with the same durations.
- **Sync.** Display only. No `player_state` change and no new request.

## Counts and verdict

B 0, M 0, m 7.

All eight round 3 findings are fixed, and the `pcScreen` hand-off is sound: X returns correctly on a plain open, world files keep the old viewer, and nothing leaks. Ready to merge once m1 to m4 and m7 are fixed in this slice (each is small). m5 and m6 go to the backlog and do not hold the merge. m1 needs a jsdom test for the Notepad round trip. m2 needs one live check of the reader after a resize, and m3 one 1400x1000 shot of the dialog.
