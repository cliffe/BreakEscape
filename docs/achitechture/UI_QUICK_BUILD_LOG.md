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
- Proof at 1400x1000, 800x600, 915x412 and 390x844 (sign-in, desktop, share window, text file
  reader on test_access_networks, Sam's PC): note and button never overlap, the note is not
  clipped, the button stays inside the chin. Chin heights 50, 50, 40 and 76.
- Tests: `test/js/pc-monitor-frame.test.mjs` asserts the chin label, the toolbar label and that
  they differ, and that the note leaves room for the button at four sizes.
