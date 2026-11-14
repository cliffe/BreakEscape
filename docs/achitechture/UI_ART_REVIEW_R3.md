# UI art review, round 3: R2 fixes, whole-number wallpaper, focus point, merge of main

Branch `build/ui-art`, tip `b3716176b`. New since R2: merge of main `372600713` (`8a0231b4c`, format 3) and the R2 fixes `30b02c3b0` (`stemOf` through `SAME_ART`; `wallpaperScale` and `wallpaperLayout` in `utils/pc-monitor.js`; optional `pcWallpaperFocus`; missing-file fallback and validator warnings; `"gender": "male"` on Kevin and Derek in m01; `test/js/same-art-manifest.test.mjs`).

**Counts: 0 B, 0 M, 1 m, 3 nit.**

## R2 findings: all closed

| R2 | State | How checked |
|---|---|---|
| M1 portrait after swap | Closed | `npc-lookalike.js:53-57` maps the raw file stem through `SAME_ART` before dropping `_v2`, so `kevin_park_talk.png` counts as `male_nerd`. `social-engine-r5` 12/12 pins it both ways (copy follows the swap, a custom portrait stays). The fixer's live chat shot was not repeated. |
| M2 fractional scale | Closed | Live, every size below lands on a whole number (table). |
| m1 phone crop | Closed for the desktop, see m1 below for the sign-in screen | Live at 390x844 the hospital is in the middle of the desktop. |
| m2 missing file | Closed | Live with the m02 file answered 404: the shared picture shows, at a whole-number scale (x3 at 1024x768, x4 at 1400x1000). Validator warning at `validate_scenario.rb:4964-4967`. |
| m3 README | Closed | `README_scenario_design.md:274-275`. |
| m4 combat pronouns | Closed | `scenario.json.erb:1400`, `:1593`; `combat-input` 3/3, `same-art-manifest` 3/3. |
| nit 2 manifest test | Closed | `same-art-manifest.test.mjs` compares both ways. |
| nit 1 280x176 | Left, as decided | |

## Live proof (keyless server on :3496, stopped by PID afterwards)

Fresh m02 games 3664 to 3668 from `new-game.rb --start-room it_department`. Gary's Workstation opened through the bridge, the password typed into the real field and sent with Enter. Each run opened the sign-in at one size, resized the window while the sign-in was open, signed in at the second size, then resized back on the desktop. No page errors, no sideways scroll.

| Window | Screen box | Wallpaper | Offset | Views |
|---|---|---|---|---|
| 1400x1000 | 1120x700 | 1120x704, x4 | 0, -2 | sign-in, desktop, file reader (after resize) |
| 1024x768 | 944x590 | 1120x704, x4 | 0, -57 | sign-in (after resize from 1400), desktop |
| 390x844 | 342x546 | 1120x704, x4 | -143, -79 (focus 0.28 at the centre) | sign-in, desktop (both after resize) |
| 667x375 | 408x254 | 560x352, x2 | 0, -49 | sign-in (resized from 390x844 while open), desktop |
| 915x412 | 488x306 | 560x352, x2 | 0, -23 | sign-in, desktop, file reader |
| 1024x768, m02 file 404 | 944x590 | shared 960x960, x3 | 0, -185 | sign-in, desktop |
| 1400x1000, m02 file 404 | 1120x700 | shared 1280x1280, x4 | 0, -290 | sign-in, desktop |

Every row covers the box (offset at most 0, offset plus size at least the box) and keeps `image-rendering: pixelated`. The shots show square, crisp pixels at every size; the 1024x768 and 1400 sign-in shots, which the fixer did not open, look right apart from m1. The file reader was opened through `handleObjectInteraction` with the PC's `pcScreen` extras (the call the desktop makes for a readable file), because Gary's only desktop file is takeable; it mounts the same monitor and gets the same layout, recomputed on resize. Share windows mount through the same `mountPcMonitor` (`container-minigame.js:378`) and were not opened.

Shots (scratch, not committed), under `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/ui-art-r3/`: `g1-signin-1400x1000.png`, `g1-signin-1024x768.png`, `g1-desktop-1024x768.png`, `g1-desktop-1400x1000.png`, `g2-signin-390x844.png`, `g2-signin-667x375.png`, `g2-desktop-667x375.png`, `g3-signin-915x412.png`, `g3-desktop-390x844.png`, `g4-signin-1400x1000.png`, `g6-reader-915x412.png`.

## pcWallpaperFocus validation

Scratch copies of m02 (moved out of the tree afterwards), validator `--no-graph`:

| Value | Result |
|---|---|
| `[0.28, 0.5]`, `[0, 1]` | 0 ❌, exit 0 |
| `[1.5, 0.5]`, `[-0.1, 0.5]` | 1 ❌ (schema maximum / minimum), exit 1 |
| `["0.3", "0.5"]` | 2 ❌ (type number), exit 1 |
| `[0.3]`, `[0.3, 0.5, 0.1]` | 1 ❌ (min / max items), exit 1 |
| `"0.3 0.5"`, `null`, `{"x": 0.3}` | 1 ❌ (type array), exit 1 |

In the engine `pcWallpaperFocus()` (`pc-monitor.js:112-116`) accepts only an array of two numbers in 0..1 and otherwise gives the centre. The value never reaches the style as text: `wallpaperLayout` (`:135-144`) works on numbers and the style gets `${number}px` (`:309-311`), and JSON cannot carry NaN or Infinity. A bad value cannot break or extend the inline style. The image URL still comes only from `pcWallpaperUrl`, unchanged since R2.

## Who reads `gender`

Engine: only `combat-input.js:23-26` (the hostile toast pronoun). The hit grunts (`player-combat.js:753-755`, `npc-combat.js:336-340`) test the sprite key's `female_` prefix and ignore `gender`; Kevin and Derek were male-grunting before and still are. Nothing in `app/`, `lib/`, `tools/` (TTS included) or any ink file reads it. The look-alike swap picks its pool from the sprite key, not from `gender`. Schema (`scenario-schema.json:4577-4581`) and the validator's NPC key list (`validate_scenario.rb:819`) already allowed it. So the two lines change the toast and nothing else.

## Format 3 after the merge

- m01 and m02: `scripts/validate_scenario.rb --no-graph`, 0 lines with ❌, exit 0, no graph rewrites.
- Neither file holds a retired key (`downIf`, `screenOwner`, `phoneOwner`, `phoneOf`, `leftBehindBy`, `screenHabit`, `printHabit`, `usbHabit`, `affordance.owners`, `affordance.private`). The branch's m01 diff against main is only the R1 sprite keys and the two `gender` lines; m02 only the two wallpaper lines.
- Rails, one file at a time: `format_8a_corpus_test` 21 runs, `format_8b_corpus_test` 29, `format_8c_corpus_test` 23, `format_upgrade_test` 22, `format_deployed_scenarios_test` 7, `format_8b_deployed_noop_test` 4, `format_8c_deployed_noop_test` 4, `scenario_schema_test` 10, `scenario_schema_boot_test` 4: 0 failures, 0 errors.

## Node tests, one file at a time (no lock)

pc-wallpaper 9, social-engine-r5 12, same-art-manifest 3, combat-input 3, pc-monitor-frame 53, container-shares 43, access-remote-signin 17, container-transfer-dialog 14, minigame-title-escape 24, phone-intro-once-and-notepad-raw 12, password-minigame-submit 2, password-signin-mode 64, password-join-mode 6, lock-scope-refusal 12, minigame-shell-fit 30, password-case-hint 5, social-npc-records 17, validator-strict-keys 15, validator-title-screen-name 2, engine-fixes-round3 5, validator-portrait-variants 3, format-8a-reader-parity 9, format-8b-reader-parity 12, format-8c-reader-parity 12, format-guard-sites 5, format-guard 9. All pass.

## Findings

### m1. On the sign-in screen the hospital sits behind the sign-in card

`scenarios/m02_ransomed_trust/scenario.json.erb:111` (`[0.28, 0.5]`), `public/break_escape/js/utils/pc-monitor.js:134-144`.

The focus point puts the hospital at the centre of the screen, and the sign-in card is centred too. In every sign-in shot (1400x1000, 1024x768, 390x844, 667x375, 915x412) the building is hidden behind the Password label and field, with a few windows showing between the rows. At 1400x1000 the offset is clamped to 0, so the building lands at screen x 368 to 528, under the card's left half. The desktop shows it clearly at every size, so R2 m1 is met where the wallpaper is meant to be seen, but the R2 fix note ("the hospital sits in the middle of the sign-in ... screens") is true only in the sense that it is under the card. Options: a `y` share that lifts the building above the card on tall screens (it cannot help at x4 on desktop sizes, where the picture barely crops), move the card off the centre on PC sign-ins, or accept it because the sign-in is a brief screen.

### nit 1. The scenario's focus point is applied to the fallback picture

`pc-monitor.js:478` sets `focus: pcWallpaperFocus(view?.gameScenario)` whichever picture loaded. When the m02 file is missing, the shared 320x320 picture is cropped around `[0.28, 0.5]` instead of its centre (live: offset 0 at 1400x1000, where the centre would be -80, so the mountain sits off to the right). A focus set without `pcWallpaper` also moves the shared picture. Passing the centre on the fallback path (`readWallpaper(PC_SHARED_WALLPAPER, false)` at `:486`) would fix both, or say in the README row that the focus applies to whatever picture shows.

### nit 2. A bad focus prints twice

`validate_scenario.rb:4968-4972` warns for every value the schema already rejects with ❌ (every bad row in the table above printed the schema error and the warning). The warning only adds something if the schema check is ever relaxed; dropping it, or limiting it to the case the schema cannot see, would halve the noise.

### nit 3. A frame at the picture's own size before it is measured

`css/pc-monitor.css:67-68` (`auto`, `0 0`) applies until the `Image` in `readWallpaper` (`pc-monitor.js:474-490`) fires `onload`, which is always asynchronous, so the first paint of a PC screen can show the wallpaper at x1 in the top-left corner. Read from the code, not seen in any shot (the cached picture loads within a frame). Starting with `background-size: cover` until the size is known would make that frame look like the old behaviour.

## Not checked

- A share window on the monitor (not reachable from Gary's desktop); it mounts through the same call.
- m01's PCs with no `pcWallpaper` live; the shared picture's path was seen through the 404 fallback, and `pc-wallpaper.test.mjs` covers the centred layout.
- The person-chat portrait after the swap (R2 M1) was not re-shot; the fixer's shot and the unit test stand.
- Game creation: after five games, `tools/playtest/new-game.rb` aborted with "No available sprite matches validSprites nil" (`new-game.rb:503`): the shared demo player's saved sprite no longer passes `sprite_valid_for_scenario?` for m02. Probably another session's preference; not touched here. The reader check reused game 3668.
- Full suites (the orchestrator runs them per merge batch).
