# UI quick build log

## 2026-11-13: chin button relabel

Decision (user): on a PC the monitor's chin button that adds the post-it is labelled
"Add Postit to notepad". The file reader's toolbar "Add to Notepad" and every non-PC
"Add to Notepad" (phone chat, VM launcher, a non-monitor lock) are unchanged.

- `utils/pc-monitor.js`: `PC_POSTIT_BUTTON_LABEL` and `pcPostitButtonHtml()` hold the one wording.
  Used by the text-file reader, the container (desktop and share window) and the password
  (sign-in) minigames, only when the PC monitor is mounted. The button also gets a matching title.
- Fit: the old chin reserve (190px) was measured against the new label in a browser. The button is
  212px wide in the full bezel and 204px in the compact one, so the reserve is now 254 (full),
  238 (compact) and 222 (narrow, where the power light is hidden to give the room back).
  The post-it also gets `min-width: min-content`, so a long word in a password is never cut.
  Min column width for the note is 96px.
- Proof (first pass, authored 27-character note only) at 1400x1000, 800x600, 915x412 and 390x844 (sign-in, desktop, share window, text file
  reader on test_access_networks, Sam's PC): note and button never overlap, the note is not
  clipped, the button stays inside the chin. Chin heights 50, 50, 40 and 76.
- Tests: `test/js/pc-monitor-frame.test.mjs` asserts the chin label, the toolbar label and that
  they differ, and that the note leaves room for the button at four sizes.

## 2026-11-13: review round 1 fixes

Source: docs/achitechture/UI_QUICK_REVIEW_R1.md. Note that the first section's "never overlap" claim
was proved only for the authored 27-character note (Minor 3); the proof below replaces it.

- Major 1 (long word covers the button): fixed.
  - `pc-monitor.js` `update()` now measures the chin's real right part (buttons, light when shown,
    side padding, 8px gap) and passes it to `pcMonitorMetrics` as `chinRoom`; the note gets the rest.
    The stored 254/238/222 reserves are only the fallback where nothing is laid out (jsdom, first pass).
    A ResizeObserver on the chin controls re-fits the note when the button is added or swapped.
  - The label is two spans. On compact and narrow frames they stack ("Add Postit" over "to notepad",
    125px wide instead of 212); on full frames it stays one line. The stacked button is 44px tall, so the
    compact chin is now 44 (was 36), the same as the full one.
  - `min-width: min-content` removed from the note. The note has `overflow-wrap: anywhere`, and each word span
    is an inline-block that wraps inside the note, so a word wider than the room breaks (at a hyphen first)
    instead of overflowing.
- Minor 1 (lone "/"): fixed. `escapeHtmlKeepWords(value, { joinPunctuation: true })` joins a
  punctuation-only token to the word before it with a no-break space. Used for the PC note in the
  text-file reader, container and password mounts only; the default is unchanged; no scenario data touched.
- Minor 2 (tests): fixed. The chin label is asserted on the sign-in screen, the PC password prompt, the
  desktop and the file reader, and a non-PC password lock still reads "Add to Notepad". The width test uses
  the measured `chinRoom`, not hard-coded 212/204. A jsdom test drives `update()` with stubbed measurements
  and a 19-character word at 390x844, 360x740 and 915x412 (note ends before the button). CSS rule checks cover
  the removed min-content and the stacked label. `escapeHtmlKeepWords` joinPunctuation has its own test.
- Minor 3 (claim): restated above; live proof below.
- Minor 4 (title): fixed. The title attributes that repeated the visible label are gone from all four call sites.

Live proof (test_access_networks, Sam's PC sign-in, scrollbars shown, probe in the scratch folder
ui-quick-fix1/probe.mjs, shots in ui-quick-fix1/shots). Notes: the authored short note, cybok_heist's
`Y3lib2syMDI1Cg==`, and a note holding a 19-character word. Overlap = button rect vs note rect, in px:
0 at every one of the 15 combinations (1400x1000, 800x600, 915x412, 390x844, 360x740). The note stays inside
the bezel, the button inside the chin, and no text overflows the note in any of them. At 360x740 the
19-character word breaks across two lines rather than covering the button.
