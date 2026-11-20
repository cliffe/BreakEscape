# UI quick review, round 1

Branch build/ui-quick, commit a02499552 on main 2f5471209. Read-only review of the chin
button relabel ("Add Postit to notepad"), the re-measured chin reserve, the hidden power light
on narrow frames and `min-width: min-content` on the post-it.

How it was checked: the diff and every call site read; the touched test files and their
importers run (pc-monitor-frame 41/41, password-signin-mode 55/55, container-shares 43/43,
phone-intro-once-and-notepad-raw 12/12, access-remote-signin 15/15, container-transfer-dialog
14/14, unlock-r1-ux 11/11); a live probe on a fresh test_access_networks game (Sam's PC sign-in,
scrollbars shown) at 1400x1000, 800x600, 915x412 and 390x844 with the authored note, a long
multi-word note, a long single word, and the real cybok_heist PC note. Shots and the probe are in
the reviewer's scratchpad (ui-quick-r1/shots, probe.mjs).

## What holds

- Every PC chin path shows the new label, and only those:
  - text-file reader chin: `text-file-minigame.js:114-115`, only reached when the monitor is
    mounted and there is a note (`:107`).
  - container desktop and share window: `container-minigame.js:785-787`, gated on
    `this.pcMonitor`, which `mountMonitor()` sets at `:733` before this point.
  - password, PC password prompt: `password-minigame.js:521-523`, monitor mounted at `:488`.
  - password, sign-in screen: `password-minigame.js:1499-1501`.
- Non-PC buttons are unchanged: the reader toolbar (`text-file-minigame.js:151` and `:212`), the
  non-monitor branches of the three call sites above, `vm-launcher-minigame.js:76`,
  `phone-chat-minigame.js:186`. No code rewrites the button's label after a click.
- Measured widths match the code comment (`pc-monitor.js:55-61`): the live button is 212px in
  the full bezel and 204px in the compact one. The reserves (254, 238, 222) add up from those
  widths, the light and its gap, the side bezel and a gap to the note.
- `data-narrow` is set by `applyPcMonitorMetrics` (`pc-monitor.js:232`), so the light rule at
  `pc-monitor.css:133-135` applies; live, the light is hidden at 390 and shown elsewhere.
- Pixel-art rule: nothing new draws a border, font or shadow. The button keeps the chin's thin
  skin and GNF at 16px (live computed style).
- Nothing in the diff is unrelated to the task; the other edits are comment wording.
- With the authored note ("Sam: sokafor / Marmalade-82") the builder's shots and my probe agree:
  no overlap, note inside the bezel, button inside the chin at all four sizes.

## Findings

### Major 1: a long word in the note covers the button on narrow and short frames

`pc-monitor.css:318` (`min-width: min-content`) beats the `max-width` that
`pcMonitorMetrics` sets (`pc-monitor.js:147`), so a note whose longest word is wider than
`postit.maxWidth` grows past the reserve and lies over the button. The reserve arithmetic, and
the test, assume the note never exceeds `maxWidth`.

Live, on the sign-in screen:

| Note | Size | maxWidth | Note right | Button left | Overlap |
|---|---|---|---|---|---|
| cybok_heist PC note, `Y3lib2syMDI1Cg==` (`scenarios/cybok_heist/scenario.json.erb:119`) | 390x844 | 128 | 190 | 164 | 26px |
| same | 360x740 | 98 | 190 | 134 | 56px |
| 19-character word in a multi-line note | 915x412 | 122 | 465 | 417 | 48px |
| same | 390x844 | 128 | 208 | 164 | 44px |
| `CorrectHorseBatteryStaple-2026` | 915x412 / 390x844 | 236 / 128 | 505 / 305 | 474 / 164 | yes |

The cybok_heist case is a regression on a shipped scenario: on main the 390 reserve left
maxWidth at 160, which held that 16-character token. The note covers the button's icon and first
letter (shot `cybok__390x844.png`). At 915x412 a tall note also shrinks the frame (the chin grows,
so the screen and the frame narrow), which cuts maxWidth to 122 and makes this worse.

Suggested fix: in `update()` (`pc-monitor.js:341-363`), after measuring, compare the note's
`offsetWidth` with `m.postit.maxWidth`. When the note is wider (min-content won), switch the chin
to a fallback: either let the chin button wrap its label onto two lines on compact frames
(about 110px instead of 204px, which frees about 95px), or stack the button above the note's
right end and grow the chin. Keep `min-width: min-content` so a password is never cut. Add a pure
helper (for example `pcChinLayout(noteMinWidth, metrics)`) that returns side by side or stacked,
unit-test it with the cybok token width, and prove the live path at 390x844 and 360x740 with that
note.

### Minor 1: the "/" sits alone on a line at 390x844

Builder shot `signin__390x844.png` and my probe: the authored note breaks as "Sam: sokafor",
"/", "Marmalade-82". A lone slash between the user name and the password reads as a stray mark
on a note the player copies from. It is a regression: main's 390 maxWidth (160) kept
"Sam: sokafor /" together; the new one (128) does not.

Suggested fix: when the PC note is built, join a token that is only punctuation (`/`, `:`, `-`)
to the word before it with a no-break space, so it wraps with that word. Do it where the PC note
HTML is made (the `postitHtml` built in the three minigames) or as an option to
`escapeHtmlKeepWords`, not as a change to that shared helper's default.

### Minor 2: the tests check arithmetic and one path, not the behaviour

- `test/js/pc-monitor-frame.test.mjs:111-124` re-derives the button position from hard-coded
  212/204 and assumes the note stops at `maxWidth`. It cannot see `min-content` overflow
  (Major 1), and if the label or button padding changes the constants stay green.
- The DOM label is asserted only on the text-file reader (`:808-814`). The container desktop
  test already checks the button is in the chin (`:397-400`) but not its label; the share window,
  the PC password prompt and the sign-in screen are not checked at all. Reverting
  `container-minigame.js:785-787` or `password-minigame.js:521-523` / `:1499-1501` leaves the
  suite green.

Suggested fix: assert `textContent` "Add Postit to notepad" at `:400` and in a sign-in test
(password-signin-mode or the R3 sign-in tests in this file), and add one non-monitor case
(a container or password lock with `showPostit`) that still reads "Add to Notepad". Back the width
claims with a live proof script rather than constants.

### Minor 3: the build log claims more than was proved

`docs/achitechture/UI_QUICK_BUILD_LOG.md:17-19` says note and button "never overlap" and the
note "is not clipped"; the proof used only the authored 27-character note. Restate it as proved
for that note and record the long-word case once Major 1 is fixed.

### Minor 4 (optional): the new `title` repeats the visible label

`container-minigame.js:786`, `password-minigame.js:522` and `:1500`, `text-file-minigame.js:114`
add a `title` equal to the button text. It adds nothing to a visible label and shows a browser
tooltip in a system font over pixel UI. The toolbar's own title (`text-file-minigame.js:212`)
already does this, so it is consistent; drop both or keep both, but there is no need to add more.

## Verdict

Not ready to merge. The relabel itself is correct at every call site and leaves the non-PC
buttons alone, but the wider button plus `min-width: min-content` lets a real scenario's note
(cybok_heist) cover the button at phone width. Fix Major 1, tighten the tests (Minor 2), and
prove the long-word case live at 390x844, 360x740 and 915x412.

Counts: blocker 0, major 1, minor 4.
