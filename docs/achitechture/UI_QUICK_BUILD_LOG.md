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

## 2026-11-13: review round 2 fixes

Source: docs/achitechture/UI_QUICK_REVIEW_R2.md.

- Major 1 (chin sized from a measurement at the stale fallback width): fixed in `utils/pc-monitor.js`.
  - `update()` keeps the last measured chin room (`lastRoom`) and uses it in its first `pcMonitorMetrics`
    call, so the note is laid out at its real width from the first pass.
  - The loop no longer ratchets across rooms: a height taken at a different room (so a different note width)
    is dropped; the larger of two measurements is kept only at one room.
  - `PC_CHIN_BUTTON_ROOM` is now 254 full (one-line button, 212px), 159 compact and 145 narrow (stacked
    button, 125px wide measured in a browser), and its comment says so.
  - The chin is now always max(button 44, note + 6): see the table below.
- Minor 1 (observer leak): `PasswordMinigame.cleanup()` now calls `stopFrameSnap()` and `pcMonitor.destroy()`.
  Both are idempotent. The first form of the test showed a second leak the review had not named: the frame-snap
  ResizeObserver and MutationObserver of the sign-in were also released only in `complete()`. The container and the
  text-file reader already destroy the monitor in `cleanup()`. Live, with a counting wrapper on ResizeObserver,
  three opens each ended through `endMinigame(false)`: sign-in 5 live while open, back to the baseline 2 after,
  three times; desktop 4 to 2; share window 4 to 2 (closing a share returns to its desktop, which is a second
  endMinigame). 0 leaked.
- Minor 2 (test repeats the formula): replaced. The `update()` test now stubs a note height that follows the
  width it is given (`style.maxWidth`), a button of 90, 125 or 170px (so the real room is below, at and above
  the fallback) and a 44px button height, at 390x844, 360x740 and 915x412, and asserts after one `update()` that the
  chin equals max(button, note + 6) and that a second `update()` changes nothing. Run against the old
  `pc-monitor.js` it fails. A new test opens the share window and asserts the chin label (R1 m2 leftover), and a
  third ends a sign-in and a desktop through `cleanup()` and counts live observers (0 left).
- Minor 3 (optional, a lone letter when a word is just wider than the note): deferred by the orchestrator. Rare and
  cosmetic; fixing it would need hyphenation rules. Not changed. With the real room now used from the first pass the
  19-character word was not re-probed; the three notes below kept every word whole.

Live proof (test_access_networks, keyless server :3444, scrollbars shown, probe in the scratch folder
ui-quick-fix2/probe.mjs, shots in ui-quick-fix2/shots). Notes: m01's real PC note, a three-line note and cybok's
`Y3lib2syMDI1Cg==`, through the served note (sign-in) and the PC's scenario note (desktop and share window), at
1400x1000, 800x600, 915x412, 390x844 and 360x740: 45 combinations. Chin height minus (note height + 6) is 0
in every one (a one-line note sits on the 44px minimum chin), overlap of note and button is 0, the note is inside
the bezel, the button inside the chin, no word breaks, and the sign-in does not scroll (915x412: 0px with the
three-line note, a 440x392 frame).

| Size | m01 note: chin / note | three-line: chin / note | cybok: chin / note |
|---|---|---|---|
| 1400x1000 | 90 / 84 | 110 / 104 | 50 / 44 |
| 800x600 | 90 / 84 | 110 / 104 | 50 / 44 |
| 915x412 | 58 / 52 | 94 / 88 | 44 / 34 |
| 390x844 | 76 / 70 | 130 / 124 | 44 / 34 |
| 360x740 | 94 / 88 | 166 / 160 | 44 / 34 |

The m01 note at 360x740 was 184 / 88 in review R2 and is 94 / 88 now; at 390x844 130 / 70 became 76 / 70.

Tests: pc-monitor-frame 46/46; escaping-shared-helpers 21, password-signin-mode 55, container-shares 43,
phone-intro-once-and-notepad-raw 12, access-remote-signin 15, access-signin-postit 8, engine-fixes-pass4b 10,
container-transfer-dialog 14, keypad-title 6, lock-scope-refusal 12, engine-fixes-round6 9, minigame-title-escape 24,
minigame-controls-layout 11, password-join-mode 6, password-minigame-submit 2, password-case-hint 5, unlock-r1-ux 11:
all pass. Full suites are left to the orchestrator's merge batch.
