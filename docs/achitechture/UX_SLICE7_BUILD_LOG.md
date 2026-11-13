# UX feedback round, slice 7: pixel pass on older minigames (build log)

Branch build/ux-pixel (from build/ux-feedback). Plan: `UX_FEEDBACK_ROUND_PLAN.md`, slice 7. Status: done.

Sync: client display only. Nothing new in player_state; no sync changes.

## Checks (built first, failing on the old tree)

- `test/js/minigame-pixel-art.test.mjs` (static, node): reads the CSS of the framework shell and the slice 7 minigames, and the minigames' own JS for inline styles (style strings, SVG attributes, Phaser text). Fails on a border or outline under 2px, a hard shadow 1px wide, border-radius without a clip-path in the same rule, a blurred box-shadow, text-shadow or drop-shadow, a smooth gradient, or a first font family that is not GNF, Press Start 2P, VT323 or a `--se-font-*` / `--ui-*font` variable. Hard-stop gradients (the CRT scanlines on framework buttons, the dashed legend lines) count as pixel art. Also pins the framework button hover to a hard ring. On the old tree: 14 of 29 tests failed (about 320 breaches). Now 29 of 29 pass.
- `tools/playtest/pixel-style-sweep.mjs` (live, Playwright): opens each scene with `MinigameFramework.startMinigame` on a keyless server and checks the computed style of every visible element and its `::before` / `::after` inside the minigame window, with the same rules. `data-diegetic` on a page root limits the check inside it to fonts (no scene uses it yet). Default is the slice 7 list; `--all` reports every registered scene but still fails only on the slice 7 list. `--params file.json` takes real scenario params (used for the forensic data platform and network architecture, taken from sis03_cyber_insurance and test-network-architecture). `--shots` writes lossless webp shots per scene and size.
  - Old tree: all 14 slice 7 scenes failed. Now: "PASS: every in-scope scene meets the pixel-art rule".

## What changed

- Framework shell (`minigames-framework.css`): no soft shadow on `.minigame-container`, no inset shade on `.minigame-game-container`, solid progress bar; `code`, `kbd`, `samp` inside a minigame use VT323 (authored scenario HTML in the forensic platform used the browser monospace).
- `utilities.css`: the shared button hover glow (`0 0 10px currentColor`) is a hard 2px ring. This rule also covers modal, tutorial and person-chat buttons.
- PIN pad: solid key colours, hard 2px or 4px drop shadows, no display glow, square lamps with hard rims.
- Consoles (drug library integrity, SCADA historian, forensic data platform, NCSC brief, network architecture, infusion pump, SIEM): Courier New and plain monospace became VT323, 1px borders became 2px, radius 0, glows removed or turned into hard 2px rings. VT323 is smaller than Courier at the same pixel size, so font sizes went up: drug library and SCADA historian about 1.4x, forensic platform and NCSC brief about 1.25x. SCADA chart axis labels (SVG) and the infusion pump's Phaser text (MAR card, conflict and confirm prompts) use VT323 at larger sizes. The infusion pump's erase key reads "DEL" in Press Start 2P (the pixel fonts have no erase glyph).
- Biometrics, fingerprint reader, BLE and Bluetooth scanners: 2px borders, no glows, gradients or text glows, square status lamps; the reader's "partial" lamp is a stepped octagon (clip-path in 2px steps).
- Text file: GNF title, solid header, no soft shadows. Notes: GNF for the observation and edit box (was Pixelify Sans with a Comic Sans fallback), solid tape strip, hard shadows.

## Tests run (no full suites, per the test lock rule)

All pass: minigame-pixel-art (29), minigame-controls-layout (11), engine-fixes-pass4b (10), engine-fixes-round4 (4), engine-fixes-round6 (9), forensic-data-platform-tabs (5), scada-historian-data (8), fingerprint-compare-features (9), biometric-lock (7), pin-cracker-feedback (8), minigame-html-sweep-a/b/c (6, 12, 13), minigame-launch-routes (31), minigame-title-escape (23).

## Live proof

Keyless headless server on :3340 from this worktree, setFPS(20) with fixed steps on. Game 2401 (test_seating, made with swap-scenario-game.rb). Shots: scratchpad `ux-shots/slice7/<scene>_<WxH>_<before|after>.webp`, 14 scenes at 1400x1000 and 800x600 (56 files). Sweep reports: scratchpad `s7_before.json`, `s7_after.json`, `s7_after_all.json`.

## Left alone (outside slice 7, from the `--all` sweep after this branch)

- log-filter: 313 non-pixel fonts and 314 hairlines (not in the plan's list; the earlier sweep probably opened it empty). Worth its own pass.
- Smaller: episode-runner (radius 13, hairlines 6), dusting (hairlines 6), warranty-checklist and coverage-decision-form (fonts, hairlines), password-guesser, authenticator, engagement-report, alarm-panel (radius), esd-pushbutton, ehr-terminal, backup-recovery, title-screen (gradients), mail-client (one font), lockpicking, capture-log, flag-station, network-segmentation-map, intel-board, sis-config-threshold (one or two each).
- Container desktop bezel, password screens, rfid and network view: owned by slices 2a, 2b, 3a, 1 and 6.
- Seen, not changed: the framework close X sits over the SCADA historian's own [CLOSE] and the network architecture legend's right end (both as before). The PIN pad's HTML erase key still shows the ⌫ glyph from a fallback font. VT323 loads from the Google Fonts import in text-file-minigame.css and bond-visualiser.css, not from a local file as GNF and Press Start 2P do.

## Handover

Not needed: finished inside the budget.
