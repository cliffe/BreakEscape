# UI art review, round 2: look-alike alias and per-scenario PC wallpaper

Branch `build/ui-art`, tip `b9c80ef88`. New since R1: `dcf3f1d7b` (M1 fix, `SAME_ART` in `utils/npc-lookalike.js`) and `b9c80ef88` (top-level `pcWallpaper`, `pcWallpaperUrl()` in `utils/pc-monitor.js`, schema, validator key list, `desktop-wallpaper-m02.png`, node test, one line in m02).

**Counts: 0 B, 2 M, 4 m, 2 nit.**

## What was checked

- **Alias reaches every sprite comparison.** The only caller of the guard is `systems/npc-lazy-loader.js:82` (`avoidPlayerLookalike(roomData.npcs, chosenPlayerSprite(), collectCharacterSprites(...))`). Inside the module both sides of the comparison (`player`, `own`) and every entry of `used` go through `normalise()` (`npc-lookalike.js:62-67`), which applies `SAME_ART` first (`:36`). No other JS compares the player's sprite key with an NPC's.
- **The swap never picks either member of a pair.** The pool holds only stock keys (`:16-21`), so `kevin_park`/`derek_lawson` can never be picked, and `free` drops the canonical key (`:68`), so the original is never picked either. In m01, Derek's `derek_lawson` normalises to `male_office_worker_v2` in `used`, so a player in `male_nerd_v2` gets Kevin as `male_telecom_v2`, as R1 fixes says.
- **Wallpaper path rules.** `pcWallpaperUrl` (`pc-monitor.js:96-100`) accepts only `^assets/[A-Za-z0-9_\-/]+\.png$` with no `//`. No dot except the final `.png`, so `..` cannot appear; no quote, bracket, space, colon or semicolon, so nothing can close the `url("...")` in the inline style (`:338-339`) or add a declaration; no scheme, so no off-site URL. Anything else gives `null` and the CSS wallpaper stays. The schema pattern (`scenario-schema.json:33-37`) is the same and the validator enforces it: a scratch copy of m02 with `https://evil.example/x.png` gives `❌ schema: #/pcWallpaper ... did not match`.
- **Server and Hacktivity.** `Game#filtered_scenario_for_bootstrap` deep-copies the scenario and removes only named keys (`flags`, `accountProfiles`, `roles`, room contents), so `pcWallpaper` reaches the client (confirmed live: `window.gameScenario.pcWallpaper` is set). Neither BreakEscape's Ruby nor Hacktivity's `app`/`lib`/`config` has a top-level key allowlist; neither needs to know the field. Scenarios are repo-authored, and the client check covers a bad value anyway. Not part of player state, so no sync growth.
- **Other PC views.** Every PC view mounts through `mountPcMonitor` (password sign-in `password-minigame.js:568`, desktop and share windows `container-minigame.js:336`, file reader `text-file-minigame.js:94`), so each gets the scenario wallpaper. The views that should not get it do not: a carried case's code lock, Wi-Fi join and plain prompts are not PC screens (`isPcScreen`, `password-minigame.js:538-544`), the ransomware displays (m02 `kim_office_terminal`, IT-ADM-02) are their own minigame, and a share window is maximised over the wallpaper. The legacy `.desktop-wallpaper` (`container-minigame.css:202-210`) and `.monitor-screen` (`password-minigame.css:224`) rules only apply when the monitor fails to mount.
- **Validator.** `scripts/validate_scenario.rb scenarios/m02_ransomed_trust/scenario.json.erb --no-graph`: 0 lines with ❌, exit 0, no graph rewrites.
- **Node tests, one file at a time (no lock).** pc-wallpaper 3/3, social-engine-r5 12/12, pc-monitor-frame 47/47, container-shares 43/43, access-remote-signin 17/17, container-transfer-dialog 14/14, minigame-title-escape 24/24, phone-intro-once-and-notepad-raw 12/12, password-minigame-submit 2/2, password-signin-mode 64/64, password-join-mode 6/6, lock-scope-refusal 12/12, minigame-shell-fit 30/30, password-case-hint 5/5, social-npc-records 17/17, validator-strict-keys 15/15, validator-title-screen-name 2/2. All pass.
- **Rails tests, one file at a time.** `test/unit/scenario_schema_test.rb` 10 runs, `scenario_schema_boot_test.rb` 4 runs, `break_escape/carry_over_server_owned_globals_test.rb` 1 run: 0 failures.

## Live proof (keyless server on :3496, stopped by PID afterwards)

Fresh m02 games 3607 and 3609 (`new-game.rb --start-room it_department`), Gary's Workstation opened through the bridge, password typed into the real field and submitted with Enter, the desktop's file icon clicked. No page errors.

| Window | Screen box | Wallpaper drawn at | Views measured |
|---|---|---|---|
| 1400x1000 | 1120x700 | x4 (1120x704), whole | sign-in, desktop |
| 390x844 | 342x546 | x3.10 (868x546), not whole | sign-in (3609), desktop |

At 1400x1000 the sign-in and desktop shots show the m02 wallpaper crisp, with the hospital left of centre. At 390x844 the screen is a portrait slice of the landscape picture: on the desktop the hospital is cut in half by the left edge, and on the sign-in screen only a sliver shows beside the Password label (the known card overlap, not counted here). Shots (scratch, not committed): `w1400-signin.png`, `w1400-desktop.png`, `w390-desktop.png`, `f390-signin.png`.

## Findings

### M1. After the swap, Kevin keeps the player's own face in the chat

`public/break_escape/js/utils/npc-lookalike.js:72-75`, with `stemOf` at `:49-52`; the test pins it at `test/js/social-engine-r5.test.mjs:295`.

The portrait follows the swap only when the talk file's stem equals the sprite's stem. `normalise('kevin_park')` is `male_nerd_v2`, stem `male_nerd`, but Kevin's talk file is `kevin_park_talk.png`, stem `kevin_park`, so it is treated as an author's custom portrait and kept. That file is a byte copy of `male_nerd_talk.png` (md5 `97e7e482...`, visemes also identical). Result, from the module with each branch's m01 data and a player in `male_nerd_v2`:

- main (Kevin authored as `male_nerd_v2` / `male_nerd_talk.png`): `{ spriteSheet: male_office_worker_v2, spriteTalk: male_office_worker_talk.png, spriteVisemes: male_office_worker_visemes.png }`
- this branch: `{ spriteSheet: male_telecom_v2 }`

So Kevin walks up in the telecom sprite but talks with the nerd face and mouth, which is the player's own avatar art. His headshot follows the world sprite (`npc-headshot.js` takes `spriteSheet` first), so a PC tile would show a third look. Main swapped all three. The same holds for Derek. The fix is to resolve `SAME_ART` in the stem comparison too (a copied key's talk and viseme files count as stock for its original), and turn the line-295 assertion round.

### M2. The wallpaper is drawn at a fractional scale below the largest screen

`public/break_escape/css/pc-monitor.css:65` (`background-size: cover`), `public/break_escape/js/utils/pc-monitor.js:338-339`.

`cover` scales by `max(screenW/280, screenH/176)`, and the screen size follows the window continuously (`pcMonitorMetrics`, `:127-173`). Only the 1120x700 maximum lands on a whole number (x4). Measured at 390x844: x3.10, so source pixels draw 3 or 4 screen pixels wide; worked from the metrics, a 1024x768 window gives 952x594, x3.40. The pixel-art UI rule wants whole-number scale. The shared 320x320 wallpaper has always been `cover` (x3.5 at 1400x1000), so that part is older than this branch, but the new asset was made for this screen and should land on the grid. One way: in the monitor's `update()`, set `background-size` to `natW*k` by `natH*k` px with `k = ceil(cover scale)`, centred and snapped to whole pixels (the picture's size is known or can be read once).

### m1. On a phone the hospital is mostly cropped out

`public/break_escape/css/pc-monitor.css:66` (`background-position: center`), asset `desktop-wallpaper-m02.png`.

A portrait screen shows the middle 110 of the picture's 280 columns; the hospital sits at columns 57 to 97, so on the 390x844 desktop half of it is off the left edge and on the sign-in screen almost none of it shows. The wallpaper's point (this is the hospital) is lost on phones. Either a focal point (an optional `pcWallpaperFocus`, or a fixed `background-position-x` near 30% for this asset), or redraw with the building nearer the centre.

### m2. A missing wallpaper file gives a flat green screen, and nothing catches the typo

`public/break_escape/js/utils/pc-monitor.js:339`, `scripts/validate_scenario.rb:731`.

The inline `background-image` replaces the CSS one, so a well-formed path to a file that does not exist leaves only `#1e3a28`, not the shared wallpaper the doc comment promises ("Anything else ... the shared wallpaper stays" is true only for malformed values). The validator checks the pattern but not the file: a scratch m02 with `assets/mini-games/no-such-file.png` raised no wallpaper line. The validator already warns for a missing `chatBackground` (`:4945-4956`, `asset_exists`), so the same check fits here. Layering the shared picture under the scenario's one in the inline style would also give the fallback.

### m3. `pcWallpaper` is not in the scenario-format doc

`README_scenario_design.md:264-280` ("Top-Level Optional Scenario Properties") lists `show_scenario_brief`, `disableAttacks`, `creditsTheme`, `creditsOverlay`, `gameClock` and others; `titleScreenName` has its own section (`:2434-2439`). `pcWallpaper` appears only in the schema description. Add a row: a PNG under `assets/`, shown on every PC screen in the mission, absent means the shared wallpaper, size it for 16:10 at a whole-number scale.

### m4. Kevin and Derek are now "They" in combat toasts

`public/break_escape/js/systems/combat-input.js:22-27`, used at `:18` and `:39`.

With no `gender` field the pronoun comes from the sprite key's `male_`/`female_` prefix. `kevin_park` and `derek_lawson` have neither, so "He's past talking." and "... He's coming for you!" became "They're" for both (m01 sets no `gender` on either; `scenario.json.erb:1395-1405`, `:1587-1597`). This came in with R1's key change, not the R2 commits, and R1 missed it. Add `"gender": "male"` to both NPCs, or let the helper resolve `SAME_ART`. The player and NPC grunt sounds (`npc-combat.js:340`, `player-combat.js:755`) only test `female_`, so they are unaffected.

### nit 1. 280x176 is not 16:10

At x4 the picture is 704 px tall in a 700 px screen, so half a source pixel is cut from the top and bottom rows. 280x175 would fit exactly. Harmless; worth knowing for the next wallpaper.

### nit 2. Nothing keeps `SAME_ART` in step with the manifest

`npc-lookalike.js:25-28` repeats the `copied_from` entries of `tools/pixellab_characters.json` (`:239`, `:629`). The comment asks for a line per new copy, but a forgotten line fails silently. A node test that reads the manifest's `copied_from` pairs and asserts each is in `SAME_ART` would catch it, and gives `copied_from` a reader (R1 nit 2).

## Not checked

- The file reader opened from Gary's desktop on the monitor: clicking the icon took the takeable file into inventory instead of opening it, so that view was not shot. It mounts through the same `mountPcMonitor` call.
- Whether person-chat shows the player's portrait beside Kevin's during the M1 case; the finding stands on the NPC side alone.
- Full suites (the orchestrator runs them per merge batch).
