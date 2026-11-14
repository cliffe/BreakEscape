# UI quick review, round 2

Branch build/ui-quick, tip 824ef3c6d on main 2f5471209. Read-only review of the round 1 fixes:
the measured chin room in `pc-monitor.js` `update()`, the stacked chin label on compact and
narrow frames (compact chin 36 to 44px), the note wrapping over-long words, `escapeHtmlKeepWords`
`joinPunctuation` for PC notes, the ResizeObserver on the chin controls, and the new tests.

How it was checked: `git diff main..HEAD` and `git diff 891b86785..HEAD` read in full; the touched
test files and their importers run without the lock (pc-monitor-frame 44/44,
escaping-shared-helpers 21/21, password-signin-mode 55/55, container-shares 43/43,
phone-intro-once-and-notepad-raw 12/12, access-remote-signin 15/15). Live probe on a keyless
server on :3443, test_access_networks, Sam's PC sign-in, scrollbars shown, at 1400x1000, 800x600,
915x412, 390x844 and 360x740. Unlike the fixer's probe (which replaced the note's HTML after the
mount), the note went through the real path: the served `postitNote` from `loginAccounts` was
swapped, so escaping, mounting, measuring and the ResizeObserver all ran as in play. Notes: the
authored note, cybok_heist's `Y3lib2syMDI1Cg==`, a 19-character word, a three-line note holding
that word, `CorrectHorseBatteryStaple-2026`, and the real PC notes from m01 (`tiaspbiqe2r - ...`,
100 characters), sis01 (`NAS: ... | ... | ...`, 109) and m03 (`IT reset: ...`, 96). A wrapped
`ResizeObserver` counted live observations and callbacks. Probe scripts and shots are in the
reviewer's scratchpad (ui-quick-r2/probe*.mjs, shots, shots2, shots3).

## R1 findings

| R1 finding | Status | Evidence |
|---|---|---|
| Major 1: a long word covers the button | Closed | Overlap 0px and note inside the bezel in all 40 live combinations (8 notes x 5 sizes). cybok at 390x844: note right 190, button left 243; at 360x740: 190 vs 213. 19-character word at 915x412: 404 vs 564. `min-width: min-content` is gone (`pc-monitor.css:313-319`); `overflow-wrap: anywhere` (`:325`) and the inline-block word spans (`:328-332`) break a word wider than the note instead of overflowing it. But see new Major 1: the fix leaves the chin far too tall on narrow and short frames. |
| Minor 1: lone "/" | Closed | Live, the authored note reads "Sam: sokafor /" then "Marmalade-82" at 390x844 and 360x740. `escape-html.js:15-37`; only the three PC mounts pass `joinPunctuation` (`container-minigame.js:336`, `password-minigame.js:563`, `text-file-minigame.js:96`); the non-monitor note (`password-minigame.js:837`) keeps the default. |
| Minor 2: tests check arithmetic and one path | Partly closed | The label is now asserted on the sign-in, the PC password prompt, the desktop and a non-PC lock (`pc-monitor-frame.test.mjs:1106-1146`), and the reader keeps its own assertion (`:852-861`). The share window is still not checked, though the new test's name says "and the file reader" and does not open one. The new `update()` test mirrors the code (new Minor 2). |
| Minor 3: build log over-claims | Closed for overlap, new gap | `UI_QUICK_BUILD_LOG.md:17` now says "authored 27-character note only" and `:50-55` adds the long-word proof. The proof measured overlap only, not whether the chin fits the note, so it missed new Major 1. |
| Minor 4: title repeats the label | Closed | The four `title` lines are gone; asserted empty at `pc-monitor-frame.test.mjs:861` (reader) and `:1113` (sign-in). |

## New findings

### Major 1: the chin is sized for the note at the old fallback width, so it stays up to 96px too tall

`pc-monitor.js:367` starts every `update()` with `pcMonitorMetrics(..., { postitHeight: noteH })`
and no `chinRoom`, so the first pass lays the note out at the stored fallback reserve
(`PC_CHIN_BUTTON_ROOM`, `pc-monitor.js:62`: 238 compact, 222 narrow, still the widths of the
old one-line 204px button). The loop then measures the real room (about 159 compact, 145 narrow
with the stacked label) and widens the note, but `measured = Math.max(measured, h)` (`:377`)
keeps the tall height taken at the narrow fallback width. The chin is sized for that height
while the note is drawn at the wider width. Calling `update()` again does not help: it repeats
the same first pass every time.

Live (chin height vs note height; the chin should be note + 6):

| Note | Size | Chin | Note | Empty chin below the note |
|---|---|---|---|---|
| m01 PC note (`scenarios/m01_first_contact/scenario.json.erb:1816`) | 360x740 | 184 | 88 | 90px |
| m01 PC note | 390x844 | 130 | 70 | 54px |
| m03 PC note | 360x740 | 148 | 88 | 54px |
| sis01 PC note | 915x412 | 94 | 70 | 18px |
| authored Sam note | 360x740 | 94 | 52 | 36px |
| authored Sam note | 390x844 | 76 | 52 | 18px |

At 360x740 the fallback gives the note `max(96, 344 - 24 - 222) = 98px`, where the m01 note is
178px tall: 4 + 178 + 2 = 184, the chin measured. The empty band is visible in shot
`shots2/m01__360x740.png`. On short frames the taller chin also narrows the monitor: the sis01
and m03 notes at 915x412 give a 412x260 screen (440px frame in a 915px window), and the three-line
note gives a 284x170 screen with the sign-in tiles scrolling by 46px (`shots/multi__915x412.png`),
the note squeezed to 129px and broken into seven lines. m01 and sis01 are production gate
missions.

Fix: keep the last measured room in the mount's closure and pass it to the first
`pcMonitorMetrics` call in `update()`, so the first pass already uses the real width; reset
`measured` to 0 whenever `room` changes inside the loop, so a height taken at a different width
cannot hold. Update `PC_CHIN_BUTTON_ROOM` (`:62`) and its comment (`:55-61`, which still says
204px compact) to the stacked button's measured widths so the first mount is close too. Test it
in jsdom with an `offsetHeight` stub that depends on the note's `style.maxWidth` (for example
1760 / maxWidth lines of 20px), and assert the chin equals note + 6 after `update()`; prove it
live at 360x740, 390x844 and 915x412 with the m01 note and report chin height against note
height, not only overlap.

### Minor 1: the password minigame leaks the chin ResizeObserver when it ends without complete()

`pc-monitor.js:412` adds the observer and `parts.destroy()` (`:421`) disconnects it, but the
password minigame calls `destroy()` only in `complete()` (`password-minigame.js:684-687`), not in
`cleanup()` (`:1396-1399`). `MinigameFramework.endMinigame()` calls `cleanup()` only
(`minigame-manager.js:233`). Live: three sign-in opens ended through `endMinigame(false)` left
three more live observations (2 before, 5 after, still 5 after a later close). The callback is
guarded by `root.isConnected`, so nothing misfires; it holds the detached monitor in memory. The
container (`container-minigame.js:649`) and the reader (`text-file-minigame.js:506`) call
`destroy()` from `cleanup()` and are fine.

Fix: call `this.pcMonitor?.destroy?.()` in `PasswordMinigame.cleanup()` (it is idempotent apart
from a second `removeEventListener`, which is harmless), and add a jsdom test that ends a PC
sign-in through `endMinigame` and checks `disconnect` ran (stub `ResizeObserver`).

### Minor 2: the new `update()` test stubs the thing it tests

`pc-monitor-frame.test.mjs:143-169` stubs the controls' width (125), the light and a fixed note
height of 60 (`:158`), then recomputes the room with the same formula as `measureChinRoom`
(`:161` against `pc-monitor.js:354-362`). It proves that `update()` passes the stub into the
arithmetic, but a note height that does not depend on its width means it cannot see new Major 1,
and the 125px stacked width is never checked against a browser. The stacked label and the
`overflow-wrap` rule are checked as CSS text only (`:133-141`). Fix: as in Major 1, make the
stubbed height follow `style.maxWidth`, assert chin against note height, and keep the live probe
as the evidence for widths (record the stacked button's measured width in the build log).

### Minor 3 (optional): a word just wider than the note leaves one letter on its own line

With `overflow-wrap: anywhere`, the 19-character word at 360x740 renders "Abcdefghijklmnopqr"
then "s" (`shots/word19__360x740.png`), and `CorrectHorseBatteryStaple-2026` breaks across two
lines at 390x844 and 360x740. No real scenario note hit this in the probe (the m01, m03, sis01
and cybok notes kept every word whole), and the player copies the note with the button, so this is
the accepted price of closing R1 Major 1. Once Major 1 is fixed the real room (about 30px more at
360) should keep the 19-character word whole; recheck then.

## Other checks (no finding)

- ResizeObserver loops and duplicates: one observer per mount (`pc-monitor.js:411-413`), only
  when there is a note; about two callbacks per open, no "ResizeObserver loop" errors in the
  console across 70 opens; `update()` changes the note and frame, not the controls' size, so it
  does not feed itself. Opens closed through `complete()` returned the live count to its baseline.
- 8px taller compact chin at 915x412: with a one-line note the screen is 492x310 and the sign-in
  does not scroll; the button sits inside the chin. The squeeze that does matter is new Major 1.
  The desktop and share views were not probed live at this size.
- `escapeHtmlKeepWords` safety (`escape-html.js:15-37`): every word, joined or not, goes through
  `escapeHtml` (`:37`), which escapes `& < > " '`; only whitespace runs pass through raw, and those
  are not markup. A punctuation-only token such as `<>` is joined and still escaped. The join is
  never across a line break and never at the start. The Notepad entry is built from the raw note,
  not from the rendered text, so the no-break space never reaches the notebook.
- Pixel-art rule: nothing new draws a border, radius, shadow or gradient. The stacked label keeps
  the button's GNF face at whole-pixel sizes (14px line height); shots show it crisp. The note
  keeps its existing style.
- Non-PC "Add to Notepad" and the reader toolbar label are unchanged (`password-minigame.js:837`,
  `text-file-minigame.js:151`, `:212`).

## Verdict

Not ready to merge. R1 Major 1 is closed (the note never covers the button, live at every size
with every note tried) and R1 Minors 1, 3 and 4 are closed, with Minor 2 mostly closed. The new
measured-room path, though, sizes the chin from a measurement taken at the old fallback width,
so on phones and short frames real mission notes (m01, m03, sis01) sit in a chin up to 90px
taller than they need, shrinking the screen. Fix Major 1 (carry the measured room into the first
pass and reset the ratchet when the room changes), add the password `cleanup()` destroy, and
prove chin height against note height live.

Counts: blocker 0, major 1, minor 3 (one optional).
