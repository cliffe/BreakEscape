# Ambient start-from-silence fix, review round 2

Branch fix/ambient-start-transient, commit 67a2e5562 on 9ccb635ca (whole branch against 73803625f also read).
Files: public/break_escape/js/systems/sound-manager.js, test/js/ambient-start-from-silence.test.mjs.

Count: B0 M0 m3

R1's M1 and m1 to m3 are closed for the paths that matter. Three minor residuals remain, all test or hygiene gaps with no failure seen live. The live measurement shows no start transient.

## R1 closure

| R1 item | Status | Evidence |
|---|---|---|
| M1 test did not guard the `from` hunks | Closed | The fake now lags both `setVolume` and the play config (`pendingVol`, applied only on `audioTick`). Tests assert on `tweens[..].cfg.from`. Mutants below: dropping `volume: 0` from `play()`, dropping the `_writeVol(sound, 0)` after play (both paths), and reverting `_readVol` all fail tests. |
| m1 same-tick re-fade reads stale gain | Closed for duck, `fadeLoopTo`, `fadeAmbientTo` re-fade and `stopAmbient`; not for two paths, see m1 below | `_writeVol`/`_readVol` WeakMap; test 3 covers fresh start plus duck in one task for both ambient and side loop. |
| m2 `stopAmbient` read `sound.volume` | Closed | sound-manager.js:376 uses `_readVol`; test 4 fails if reverted. |
| m3 comments | Closed | Comments at :463-465 and :547 now say the gain read-back lags and that Phaser merges the config. Accurate. |

Tests: ambient-start-from-silence 6 of 6; with room-tone, ending-credits-audio and every `*sound*` test file, 47 pass, 0 fail.

## Findings

### m1. Two reads of `_readVol` have no test, so mutants survive
sound-manager.js:445 (room-tone-off fade-out in `fadeAmbientTo`, `const startVol = this._readVol(sound)`) and :502 (`_fadeOutgoing`, `from: this._readVol(sound)`).

Scratch mutants, each run against the test file with the real source restored afterwards (md5 matches HEAD):

| Mutant | Result |
|---|---|
| `_writeVol(sound, 0)` removed after `play()` in fadeAmbientTo (the one the fixer could not apply) | 3 fail, killed |
| `_writeVol(sound, 0)` removed after `play()` in fadeLoopTo | 2 fail, killed |
| `volume: 0` removed from both `play()` configs | 2 fail, killed |
| `_readVol` returns `sound.volume` always | 4 fail, killed |
| `_writeVol` stops recording to the WeakMap | 4 fail, killed |
| `stopAmbient` back to `sound.volume` | 1 fail, killed |
| `fadeLoopTo` `from` back to `sound.volume` | 2 fail, killed |
| fadeAmbientTo tween `onUpdate` back to plain `setVolume` | 2 fail, killed |
| `_fadeOutgoing` `from` back to `sound.volume` (:502) | 0 fail, SURVIVES |
| room-tone-off fade-out `startVol` back to `sound.volume` (:445) | 0 fail, SURVIVES |
| `play()` option volume (:232) back to plain `setVolume` | 0 fail, SURVIVES (see m3) |

Failure scenario: `fadeAmbientTo('A', 1)` as a fresh start, then in the same task `fadeAmbientTo('B', 1, 400, { crossfade: true })`. A is the outgoing loop, `_fadeOutgoing` starts from the stale gain (1.0), and A jumps to full for one frame before fading out. Someone reverts :502 or :445 and the suite stays green. Not seen in normal play (rooms.js:3307 and :3309 run on separate ticks), so it is a coverage gap, not a live bug.

Fix: one test that starts A fresh and crossfades to B in the same task and asserts the outgoing tween's `from` is 0; one for the `crossfade && level 0` path at :445.

### m2. `_readVol` can go stale through direct `setVolume` calls, none reachable today
Grep of `setVolume` and `.volume` over public/break_escape/js, by path:

- music/ending-audio.js:41 and :50 fade a Phaser sound with `sound.volume` and `sound.setVolume`, bypassing `_writeVol`. The record then lags the true gain. Not reachable: `silenceBackgroundForEnding` calls `suppressAmbience(true)` first, stops each sound after its fade, and no SoundManager path restarts a sound without writing 0 (play-ambient, `fadeAmbientTo` and `fadeLoopTo` all write 0 on a fresh start; `play()` writes the category volume). The generic `play()` at :232 also writes.
- systems/npc-barks.js:107 and :109 set volume on sounds they own (`barkSound`, `vibrateSound`), not in `sm.sounds`. Unaffected.
- systems/tts-manager.js, phone-chat-ui.js: HTMLAudio and speech, not Phaser sounds.
- systems/npc-office-visuals.js:310 uses `scene.sound.play(key, { volume })`, a one-shot outside `sm.sounds`. Unaffected. :459 only reads `.volume`.
- core/player.js:64, ui/health-ui.js:166, phone-chat-minigame.js:1165, container-minigame.js:1187, notes-minigame.js:328 use `game.sound.get(key) || add(key)` for their own keys. If one of those keys were also an `sm.sounds` loop, the cached sound object would be shared and the record could go stale. They are one-shot effect keys, not ambient keys.
- `setMasterVolume` (:586-594) goes through `_writeVol`, so the record follows it. It writes the effects-category volume onto every sound, including a playing ambient, which is older behaviour (the next tween frame overwrites it).
- Phaser's own play-config write, a restart after `stop()`, and a destroyed and recreated sound: the WeakMap is keyed by sound object, so a recreated sound has no record and falls back to `sound.volume`, and it is not playing so it takes the fresh path anyway. After `stop()` the record holds the last tween value (0 for a fade-out); every restart path rewrites 0 before use. Mute is a separate node and `toggle()` only flips `enabled`: no volume write.

Failure scenario (hypothetical): a future module fades an `sm.sounds` loop with its own `setVolume` and leaves it playing. The next `fadeLoopTo` on that key starts from the old record, not the true gain, and steps. Nothing does this now.

Fix: none needed. If anything, make `silenceBackgroundForEnding` call `sm._writeVol` when present, or add a one-line comment at :312 saying "all volume writes on `sm.sounds` go through here".

### m3. `play()` option volume write is untested and the delayed path writes early
sound-manager.js:232 and :243-247.

Mutant at :232 survives. Also, with `options.delay`, the volume is written now and `sound.play()` runs later; a fade started in between reads the new record, which is right, but nothing tests it. No current caller passes `delay` for a looping ambient.

Fix: optional one-case test, or leave.

## Audio measurement

Setup: keyless server on 127.0.0.1:3094 from this worktree (BUNDLE_PATH set to the main tree's vendor/bundle, no Gemini key, BREAK_ESCAPE_STANDALONE=true); new m09_digital_archaeology game id 8024 via new-game.rb (flags XML moved to the scratchpad); Xvfb :94 with WAYLAND_DISPLAY unset; headed Chromium via tools/video/capture/launch.mjs; setFPS(20) with fixedStep on was applied in the earlier attempt but not in the final recorded run (audio does not depend on physics). PipeWire null sink be_rec_94, recorded with ffmpeg at 48 kHz from be_rec_94.monitor. MusicController music slider 0 (be_music_vol 0, so no music; ambient uses the separate SoundManager music category at 0.5).

Procedure: game loaded, a page-wide init script installed, page reloaded so the first ambient start of the fresh page is captured. The first ambient start: `fadeAmbientTo('server_room_ventilation', 0.01, 400)` in loading_dock, so the tween target is 0.005 gain (about -46 dB below the unfaded loop).

Page-side rAF log of the gain: 0, 0, 0.00056, 0.00106, 0.00145 ... 0.00378 at about 36 ms steps. The first sample is 0, not near 1.

Recorded audio, 10 ms windows, time from the audible onset (first window above -90 dBFS):

| Window after onset | Peak (dBFS) | RMS (dBFS) |
|---|---|---|
| 0 to 100 ms | -65.2 | -77.0 |
| 100 to 200 ms | -60.8 | -71.2 |
| 200 to 300 ms | -57.2 | -66.9 |
| 300 to 400 ms | -52.5 | -63.7 |
| 400 to 600 ms | -52.7 | -62.6 |
| 600 to 1000 ms | -52.5 | -63.5 |

Result: the first 100 ms is the quietest part, 12.7 dB below the settled hum (peak) and rising monotonically. There is no spike above the fade-in. A stale base-volume start would show at about -6 dBFS peak (gain 1.0 against 0.005), 59 dB above what was recorded. Music volume 0, so the hum is the only source.

Not done: a pre-fix (73803625f) recording for a direct A/B. R1 already showed the pre-fix first read of 1 live, and this run only needed to show the post-fix output.

Raw files (scratchpad): run1.wav, run1.log.json, measure.mjs under .../scratchpad/ar2/.

Teardown by PID: server 3556056, Xvfb 3559503, null sink node 105 (pw-cli destroy). Port 3094 free afterwards, no /tmp/.X11-unix/X94, no be_rec_94 node left. Worktree source md5 equals HEAD; only the untracked node_modules is in `git status`.

## Orphaned processes (not killed)

Stale `m01-ol-evening.mjs`:

| PID | PPID | Started | Age at check | cwd | Command |
|---|---|---|---|---|---|
| 2410529 | 5363 (systemd --user) | Tue 17 Nov 10:53:26 | about 12 h 43 m | .claude/worktrees/p-ol-m01 | `node tools/playtest/m01-ol-evening.mjs 7083 3094 tmp` |
| 2410608 (its headless Chromium) | 2410529 | Tue 17 Nov 10:53:26 | about 12 h 43 m | .claude/worktrees/p-ol-m01 | chrome-headless-shell (playwright chromium_headless_shell-1248) |

It targets game 7083 on port 3094. Nothing was listening on 3094 before this review, so it is waiting against a dead server. If it were still polling while my server ran on 3094, it would have hit game 7083, which does not exist on this database state of mine; no effect was seen in the run.

Other headless Chromium roots at the time, all young (under 6 minutes) with live parent node processes, so not orphans: 3488336 (parent 3488214, scratchpad ol-m06-build/live), 3524591 (3524522, p-ol-m10), 3532328 (3532311, p-ol-m07, m07-ol-s3.mjs), 3536659 (parent 3536614, process already gone on re-check), 3537611 (3537595, scratchpad live_a), 3538607 (3538100, scratchpad probe_l2). Headed playwright Chromium 3424128 (parent 3424015, p-ol-m10 playtest-session.js, 9 minutes) is live too. Older and unrelated: the snap Chromium 8719 from 9 Nov (8 days, the user's browser) and four VS Code Claude binaries.
