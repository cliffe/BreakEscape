# UX feedback round, slice 7: code review, round 1

Branch build/ux-pixel at 8505c5b66, reviewed as `git diff build/ux-feedback...HEAD`. Plan: `UX_FEEDBACK_ROUND_PLAN.md` slice 7. Build log: `UX_SLICE7_BUILD_LOG.md`.

## What I checked

- Every changed file in the diff (14 CSS files, 2 minigame JS files, the static test, the live sweep).
- The static test: 29 of 29 pass on the branch. Run against the CSS and JS of build/ux-feedback (a copy of the old files beside the new test), 17 of 29 fail, so it catches the old breaches.
- Edge cases of the static checker's helpers (gradients, blurs, fonts) with a small probe.
- Tests of the touched minigames, without the lock: minigame-pixel-art 29, minigame-controls-layout 11, scada-historian-data 8, forensic-data-platform-tabs 5, biometric-lock 7, pin-cracker-feedback 8, fingerprint-compare-features 9. All pass. No test drives the infusion pump.
- Behaviour: the only JS changes are fonts, sizes and the pump's erase key label. The key's value is still `⌫`, so `handleBackspace` still fires; only the drawn label reads "DEL". No player_state or sync change.
- All 14 "after" shots at 800x600, and before/after pairs where something looked off.
- My own shots on a keyless headless server on :3341 (game 2439 made with `swap-scenario-game.rb test_seating test_seating`, setFPS(20), fixed steps on, server stopped afterwards): the pump's main screen (charts global set), the NCSC brief unsealed, the BLE and Bluetooth scanners with two devices each, the drug library and SCADA historian; the same set again with fonts.googleapis.com and fonts.gstatic.com blocked; and a hover probe of the shared button classes with and without the UI theme.
- Writing rules: no em or en dashes and no model names in added lines.

## Findings

### Majors

**M1. VT323 is loaded only from Google Fonts, and this slice makes it the body font of seven consoles.**
`fonts.css` self-hosts GNF, Press Start 2P, Pixelify Sans and Source Sans 3, but VT323 comes only from `@import url('https://fonts.googleapis.com/...')` in `text-file-minigame.css` and `bond-visualiser.css`. No VT323 file exists in the repository. `games/show.html.erb` line 22 says "All fonts are self-hosted ... via fonts.css", which is no longer true for the font this slice uses most.
- Online inside Hacktivity it works: Hacktivity's CSP allows `style-src https:` and `font-src https:`.
- Offline, or anywhere Google Fonts is blocked, it fails. With both Google font hosts blocked, the font list showed no VT323 face, and the drug library fell back to the browser's smooth monospace (DejaVu Sans Mono). Because the slice raised font sizes about 1.4x to suit VT323, the fallback text is now oversized: the table headers wrap ("DOSE / MIN"). That breaks the pixel-art rule and the layout at once. Scratchpad shots: `s7r1/r1_drug-library-integrity_800x600_offline.png`, compare `s7r1/online_offline.png`.
- Each game load also sends the player's IP address to Google, which a self-hosted font avoids.
- The sweep cannot see any of this: it checks the computed `font-family` name, not the face that was drawn.
Fix: add VT323 (SIL OFL) as a local woff2 with an `@font-face` in `fonts.css`, the same as Press Start 2P; remove both `@import`s; and have the sweep check `document.fonts` for a loaded VT323 face (or `document.fonts.check('16px VT323')` after `document.fonts.ready`).

**M2. The sweep and the before/after shots cover the gate or empty state of six scenes, not their main screens.**
- infusion-pump: the "PAPER MAR CHARTS REQUIRED" gate (`paper_charts_collected` unset). The pump UI never draws.
- ncsc-brief: the sealed state.
- ble-scanner and bluetooth-scanner: "No devices detected". The `devices` params in the sweep are ignored: the scenes fill their lists from `gameState` and room scans, so the device rows, UUID chips and pairing panel never draw.
- fingerprint-reader: no lifts to present, so no lift cards.
- biometrics: 0 samples, so no sample cards.

So the sweep passes on 10 to 27 elements in these scenes and would not catch a regression in the parts players use most. The plan asks for before and after shots of every minigame touched; for these six the pairs show the gate. The pump's main UI is also a Phaser canvas, which a DOM sweep cannot inspect at all; only the static JS check covers it.
Fix: give each of these scenes a setup hook in the sweep (set the gate global, call `addBleDevice` / `addBluetoothDevice` on `MinigameFramework.currentMinigame`, seed `gameState.biometricSamples` and the reader's lifts, press the brief's open button), then retake the shots. My shots of the pump's main screen and the scanners with devices are in the scratchpad (`s7r1/r1_*_800x600.png`, `s7r1/r1_*_1400x1000.png`). In them the device rows and the pump keypad meet the rule.

**M3. Infusion pump text is below a legible size, and the gate text got smaller.**
VT323 draws much smaller than a system monospace at the same pixel size. It needs about 16px to read cleanly, and this slice moved several pump strings to it at sizes well below that:
- Phaser MAR card: hospital header VT323 8px bold (unchanged size, line 172), sub-header and "tiny" style 10px, labels 11px, values 13px. The canvas is 820x510, FIT-scaled with smoothing. At 800x600 the header and labels cannot be read; at 1400x1000 the header is still a smear. Shots: `s7r1/r1_infusion-pump_800x600.png`, `s7r1/r1_infusion-pump_1400x1000.png`.
- Confirm prompt "Does this match the paper prescription?" (line 680): VT323 11px. Only the font changed, the size did not, unlike the conflict prompt next to it, which was raised.
- Gate text `.ip-no-charts-sub`: VT323 12px. In the builder's own pair (`infusion-pump_800x600_before/after.webp`) it went from readable 12px monospace to text about half as tall.
- `.ip-modal-prompt`: VT323 11px.
Fix: raise VT323 to at least 16px in these places (the gate text, both prompts, the MAR values), or use Press Start 2P at 8px for the tiny labels and header. Consider `pixelArt: true` / `roundPixels` on the pump's Phaser config so the scaled canvas stays crisp.

### Minors

**m1. The sweep's drop-shadow check reads the colour, not the blur.**
`/blur\(|drop-shadow\([^)]*\s[1-9]/` stops at the first `)`, which is inside `rgba(...)` in the computed value. Proven in the browser: `filter: drop-shadow(0 0 5px rgba(0,0,0,0.5))` computes to `drop-shadow(rgba(0, 0, 0, 0.5) 0px 0px 5px)` and is not flagged. A coloured drop-shadow with no blur (`rgba(0, 255, 65, ...) 0px 0px 0px`) would be flagged wrongly. The static test handles CSS drop-shadows correctly, so today only inline or computed ones slip through.
Fix: parse the filter's drop-shadow arguments the way `shadowBlurs` does (strip the colour, take the third length).

**m2. The static JS check misses Phaser and SVG hairlines.**
The pump still draws 1px lines on the canvas (`gfx.lineStyle(1, ...)` at lines 180 and 205, `dg.lineStyle(1, ...)` at 295), and these are the same dividers whose CSS twins this slice made 2px. The SCADA chart axes and ticks use `stroke-width '1'` (lines 312, 324, 345, 363, 368). The check also misses `.style.boxShadow =`, `.style.border =` and Phaser `setShadow(`.
Fix: make the dividers and axes 2px, and add `lineStyle(1`, `setStrokeStyle(1`, `stroke-width` 1 (excluding data series, if those stay thin on purpose) and the camelCase style setters to `jsBreaches`.

**m3. The hover ring shows only where it looks wrong, and the test pins a rule players do not see.**
Under the default UI theme ("general"), `ui-themes.css` resets `box-shadow` on hover for `.minigame-button`, `.modal-button`, `.tutorial-btn` and the rest, and adds `filter: var(--ui-glow-filter)`, a blurred `drop-shadow(0 0 4px ...)`. So the new 2px ring is never seen on those buttons. Only `.person-chat-choice-button` and `.person-chat-continue-button` keep it, because the themed rule for them resets the border, not the box-shadow. On those, the result is a square 2px ring in the accent colour around the stepped 9-slice skin, plus the blurred glow. Probe: computed `rgb(255, 204, 68) 0px 0px 0px 2px` with `drop-shadow(... 0px 0px 4px)`; shot `s7r1/hover_current_person-chat-choice-button.png`. Without a theme the ring works as intended. The last test in `minigame-pixel-art.test.mjs` asserts the unthemed rule, which says nothing about what players see. The three `#session-*-btn:hover` rules just below still use 10px blurred glows.
Fix: add the person-chat buttons to the themed hover reset (`box-shadow: none`), or skip the ring when a theme is set. Treat the theme's `--ui-glow-filter` and the session glows as follow-ups.

**m4. Non-pixel glyphs remain in in-scope scenes, and neither check can see them.**
The PIN pad's erase key still draws ⌫ from a fallback font, while the pump's key now reads "DEL", so the two keypads disagree. The NCSC brief shows ✉ and a colour 🔒 emoji. The pump MAR has "Checked ✓", and the SCADA rack checkbox has ✓. VT323, GNF and Press Start 2P lack these glyphs, so they come from a system font.
Fix: "DEL" on the PIN pad too; pixel icons, or plain text, for the brief's envelope and lock and for the ticks.

**m5. Other VT323 text sits below a comfortable size.**
At 800x600, 33 text elements in the drug library are VT323 14px (file links, table figures). They can be read in the shots, but only just. The SCADA axis labels are VT323 14px inside an SVG that is scaled down, so they draw at about 6 to 7px (`s7r1/scada_axis_pair.png`). They were as small before, but the slice set out to make the reading text legible.
Fix: 16px for VT323 body text; size the SVG labels for the scale the chart is drawn at.

### Nits

**n1.** The `.ip-prescription-panel` and `.ip-rx-*` rules in `infusion-pump-minigame.css` have no users (the MAR card is drawn in Phaser). The slice edited dead CSS whose VT323 sizes (7 to 10px) would be illegible if it were ever used. Delete the rules (per the delete rule) or leave them alone.

**n2.** The pump's inset "screw" box-shadow was only reflowed onto one line, with no change of value. This is noise in the diff.

**n3.** Static checker edge cases: a hard stop with mixed units (`red 2px, blue 2%`) passes; `clip-path: none` in the same rule excuses a radius; a `-1px` shadow offset is not counted as a hairline. These are unlikely in this CSS, but cheap to tighten.

**n4.** The build log says 14 of 29 tests failed on the old tree. With the old CSS and JS I count 17 of 29. This is a log accuracy point only.

**n5.** Several strings are italic in a pixel font ("No attempts yet", "Last seen", the NCSC subtitle, the pump's prescriber name). The browser slants them synthetically, which smears the pixels. Use upright text, or colour, for emphasis.

## Follow-up (not rated, outside slice 7)

- log-filter (313 fonts, 314 hairlines) and the other scenes the `--all` sweep lists (episode-runner, dusting, warranty-checklist, coverage-decision-form, password-guesser, authenticator, engagement-report, alarm-panel, esd-pushbutton, ehr-terminal, backup-recovery, title-screen, mail-client, lockpicking, capture-log, flag-station, network-segmentation-map, intel-board, sis-config-threshold).
- The UI theme layer: every theme's `--ui-glow-filter` is a blurred drop-shadow on button hover, and secops adds `--ui-text-glow`.
- Layout seen at 800x600 and probably older than this slice: the framework close X over the SCADA historian's [CLOSE] and the network architecture legend; the BLE scanner's Close button overlapping the device list; the Bluetooth expand toggle over the scanner icon; the PIN display clipped at the top; the notes search box and page counter over the notebook rings; the forensic platform's thin browser scrollbar on the tab row.

Counts: 0 blockers, 3 majors, 5 minors, 5 nits.
