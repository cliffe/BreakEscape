# Ambient start-from-silence fix, review round 1

Branch fix/ambient-start-transient, commits fe5625eff and 08a7bd3ca on 73803625f.
Files: public/break_escape/js/systems/sound-manager.js, test/js/ambient-start-from-silence.test.mjs.

Count: B0 M1 m3

The fix works live. The first sample after the first ambient play() is 0, not near 1.0, and the other fades are smooth. One test gap (M1) and three small residuals (m1 to m3) remain.

## Findings

### M1. The test does not guard the two `from` hunks
test/js/ambient-start-from-silence.test.mjs:12-16 (the fake `play`), against sound-manager.js:463 and :538.

The fake sets `audioVol = o?.volume ?? 1` inside `play()`, so `play({ volume: 0 })` makes `sound.volume` read 0 at once. Real Phaser does not. The gain only reads back after the audio thread runs. Live, `sound.volume` read straight after `play({loop:true,volume:0})` was 1 (all three first starts: server_room_ventilation, kitchen_tone, typing_loop).

Failure scenario: someone deletes the `startedNow ? 0 :` hunks. The test stays green. Live, the first fade would again start from 1 and the click returns.

Scratch reverts (copy in the scratchpad, worktree untouched):

| Reverted hunk | Result |
|---|---|
| `volume: 0` in both `play()` calls | tests 1 and 2 fail (good) |
| `startedNow ? 0 : sound.volume` at :463 | all 3 pass (not guarded) |
| `startedNow ? 0 : sound.volume` at :538 | all 3 pass (not guarded) |

A faithful fake (play config also lagged until `audioTick`) failed tests 1 and 2 on the unmodified code. Their "reads 0 straight after play" assertions then need to become "tween `from` is 0", which is what they are meant to check. With that fake and the :463 revert, the new same-tick cases below also fail.

Fix: make the fake's `play()` set `pendingVol` instead of `audioVol`, and assert on `tweens[0].cfg.from` rather than `sound.volume` straight after the call.

### m1. Same-tick re-fade after a fresh start still reads the stale gain
sound-manager.js:463 (the not-fresh branch `sound.volume`), :428 (fade-out), :489 (`_fadeOutgoing`), :538, and `setAmbientDuck` at :508-516.

The fix covers the call that starts the loop only. A second fadeAmbientTo, fadeLoopTo, duck or fade-out issued before the audio thread has run (the same JS task, or within a few ms) reads the stale base volume again.

Live, step "SAME-TICK fresh start + duck":
- `fadeAmbientTo('office_ambient',1)` then `setAmbientDuck(0.5)` in one task.
- Samples: 1.000 at 34378 ms, 0.000 at 34395, 0.957 at 34413, then a decay to the 0.25 target.
- So there is a jump to near full volume, and the old bug in miniature.

It needs two calls within a few ms. The reads had resolved by the next rAF sample (about 10 ms) in the first-start log. No such pair was found in normal play (office-room-tone.js:129 and :139 call the duck and the typing loop on separate ticks). It is a latent hazard, not a seen failure.

Fix: record the last value written (for example in each tween's onUpdate, or a `_lastVol[key]` set in the fresh-start branch and the tween) and use it instead of `sound.volume` for every `from`.

### m2. stopAmbient fade-out still reads `sound.volume`
sound-manager.js:359 (`const startVolume = sound.volume` in stopAmbient).

It is the same stale-read class and is untouched. Failure scenario: playAmbient starts a loop and stopAmbient runs in the same task. The fade-out then starts at the stale base. I did not check whether anything calls stopAmbient. It is the same fix as m1.

### m3. Comments no longer match Phaser's behaviour
sound-manager.js:448-449 and :536.

The comments say play(config) "puts back the configured base volume" / "resets the volume". In Phaser 3.60 the play config is merged into the sound's own config (BaseSound.play, `Extend(this.currentConfig, config)`), and `volume` there is also overwritten by every setVolume. The old stale value was the node's gain, not the config. The `setVolume(0)` after `play({volume:0})` is redundant but harmless. Suggest rewording the comments to say the gain read-back lags. No behaviour change.

## Answers to the review questions

1. Callers and paths. Callers are rooms.js:3307 and :3309 (zone model, `{crossfade:true}` when roomTone), `setAmbientDuck` (sound-manager.js:513 and :515) and office-room-tone.js:129 and :139. All behave as expected, except the same-tick case (m1). Live, the step-to-step volume change was at most 0.025 per frame for every sound on all of these:
   - cross-fade (kitchen_tone in, server_room_ventilation out);
   - re-fade while a tween is running (read 0.183 mid-tween, smooth);
   - fade-out to 0 then stop;
   - a fresh start after a stop (tween from 0);
   - side loop in and out.

   A paused sound has `isPlaying` false, so the new branch restarts it from 0 with `startedNow` true. That is the same restart as before, without the transient. Nothing in sound-manager.js pauses ambients. The credits path uses suppressAmbience.
2. `volume: 0` in `play()` and the base volume. Phaser merges the config into the sound's own config, and `setVolume` already wrote the config volume (WebAudioSound `set volume` writes `currentConfig.volume`). Every later start passes volume 0 and then tweens up, so a later bare `sound.play()` was already inheriting the last written volume. Nothing relies on a pristine base. `setMasterVolume` (sound-manager.js:569) re-sets every sound from `getVolumeForSound`, which does not read the config. Mute is a separate node (`muteNode`) and `toggle()` only flips `enabled`. No regression found. The HTML5 audio fallback reads its config, so it has no lag.
3. Test meaning. See M1: one hunk of three is guarded.
4. Live proof. See below.
5. Tests. Sound-related files: ambient-start-from-silence, room-tone, ending-credits-audio, door-gates-sound, consumables, phone-ring-suspend, phone-ring-layer, screen-states, validator-schema-known-keys. All pass (632 tests, 0 fail across the two runs).

## Live proof

- Game id 7981 (m09_digital_archaeology, new-game.rb, keyless server on port 3094 from this worktree, stopped by PID; no stored record edited).
- Xvfb :94, WAYLAND_DISPLAY unset, headed Chromium on that display, setFPS(20), fixedStep true.
- Music volume localStorage 0.6 (the engine's music category was 0.5, so the first-room target is 0.5 x 0.01 level).
- The hook was installed before any game script (so the first play() is seen), via a scratch probe at the scratchpad path, copied from the shared probe with the music volume raised. The shared probe.mjs was not edited.
- Room travel: this game's doors are locked, so fades after the first start were driven by direct fadeAmbientTo / fadeLoopTo calls, not walking.

First natural ambient start (loading_dock, fadeAmbientTo server_room_ventilation 0.01):
- `play({"loop":true,"volume":0})` sync read-back: 1 (the stale read this bug depends on).
- Tween `from`: 0.
- rAF samples: 0 at 9852.2 ms, 0 at 9865.1, 0.00016 at 9879.5. The first sample is 0, not near 1.0.

Later fades, max per-frame step and peak (rAF samples):

| Sound | Max step | Peak | Note |
|---|---|---|---|
| server_room_ventilation | 0.0250 | 0.500 | smooth |
| kitchen_tone | 0.0225 | 0.250 | smooth |
| typing_loop | 0.0219 | 0.250 | smooth |
| office_ambient | 1.0000 (same-tick case only) | 1.000 | see m1 |

Samples from the live run: `play()` on a fresh start read back 1 for kitchen_tone and typing_loop, and tweens started from 0.
