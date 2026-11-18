// A new ambient loop fades in from silence. Phaser's WebAudioSound reads `volume` back from
// gain.value, which only catches up with setVolume() once the audio thread has run, so a read
// straight after play() + setVolume(0) still gives the base volume. The play config is merged into
// the sound's own and reaches the gain the same way. The fake sound here lags both setVolume and the
// play config until audioTick(); fades must not take their start point from a stale read.
import test from 'node:test';
import assert from 'node:assert/strict';
import SoundManager from '../../public/break_escape/js/systems/sound-manager.js';

function lagSound(key) {
    const s = {
        key, isPlaying: false, loop: false, audioVol: 1, pendingVol: null,
        get volume() { return this.audioVol; },
        setVolume(v) { this.pendingVol = v; },
        playConfig: null,
        play(o) { this.isPlaying = true; this.loop = !!o?.loop; this.playConfig = o; this.pendingVol = o?.volume ?? 1; },
        stop() { this.isPlaying = false; },
        audioTick() { if (this.pendingVol !== null) { this.audioVol = this.pendingVol; this.pendingVol = null; } }
    };
    return s;
}

function rig(keys = ['A', 'B']) {
    const tweens = [];
    const scene = { tweens: { addCounter(cfg) { const t = { cfg, elapsed: 0, done: false, stopped: false, stop() { this.stopped = true; } }; tweens.push(t); return t; } } };
    const sm = new SoundManager(scene);
    for (const k of keys) sm.sounds[k] = lagSound(k);
    const advance = (ms) => {
        for (const t of tweens.slice()) {
            if (t.done || t.stopped) continue;
            t.elapsed = Math.min(t.cfg.duration, t.elapsed + ms);
            const v = t.cfg.from + (t.cfg.to - t.cfg.from) * (t.elapsed / t.cfg.duration);
            t.cfg.onUpdate?.({ getValue: () => v });
            if (t.elapsed >= t.cfg.duration) { t.done = true; t.cfg.onComplete?.(); }
        }
        for (const s of Object.values(sm.sounds)) s.audioTick();
    };
    return { sm, tweens, advance };
}

test('the first ambient start fades in from 0 even though the sound still reads its base volume', () => {
    const { sm, tweens, advance } = rig();
    sm.fadeAmbientTo('A', 1, 400);
    assert.equal(sm.sounds.A.playConfig.volume, 0, 'play config starts silent');
    assert.equal(sm.sounds.A.volume, 1, 'the fake really lags: the gain has not caught up');
    assert.equal(tweens[0].cfg.from, 0);
    advance(20);
    assert.ok(sm.sounds.A.volume < 0.2, `volume after 20 ms was ${sm.sounds.A.volume}`);
});

test('a side loop started with fadeLoopTo also fades in from 0', () => {
    const { sm, tweens } = rig();
    sm.fadeLoopTo('B', 0.5, 400);
    assert.equal(sm.sounds.B.playConfig.volume, 0);
    assert.equal(sm.sounds.B.volume, 1);
    assert.equal(tweens[0].cfg.from, 0);
});

test('a fresh start and a duck in the same task do not jump to the stale base volume', () => {
    const { sm, tweens } = rig();
    sm.fadeAmbientTo('A', 1, 400);
    sm.setAmbientDuck(0.5, 300);
    assert.equal(tweens[tweens.length - 1].cfg.from, 0);
    sm.fadeLoopTo('B', 0.5, 400);
    sm.setAmbientDuck(1, 300);
    assert.equal(tweens[tweens.length - 1].cfg.from, 0);
});

test('stopAmbient in the same task as a fresh start fades out from 0, not the stale base', () => {
    const { sm, tweens } = rig();
    sm.fadeAmbientTo('A', 1, 400);
    sm.stopAmbient(500);
    assert.equal(tweens[tweens.length - 1].cfg.from, 0);
});

test('a later fade starts from the last value written, even before the gain catches up', () => {
    const { sm, tweens, advance } = rig();
    sm.fadeAmbientTo('A', 1, 400); advance(200);
    const written = tweens[0].cfg.from + (tweens[0].cfg.to - tweens[0].cfg.from) * 0.5;
    sm.fadeAmbientTo('A', 0.25, 400);
    assert.equal(tweens[tweens.length - 1].cfg.from, written);
});

test('a loop already playing keeps its true current volume as the start of the next fade', () => {
    const { sm, tweens, advance } = rig();
    sm.fadeAmbientTo('A', 1, 400); advance(400);
    const at = sm.sounds.A.volume;
    assert.ok(at > 0.4);
    sm.fadeAmbientTo('A', 0.5, 400);
    assert.equal(tweens[tweens.length - 1].cfg.from, at);
});

test('a room-tone-off fade-out in the same task as a fresh start begins at 0, not the stale base', () => {
    const { sm, tweens } = rig();
    sm.fadeAmbientTo('A', 1, 400);
    sm.fadeAmbientTo('A', 0, 400);
    assert.equal(tweens[tweens.length - 1].cfg.to, 0);
    assert.equal(tweens[tweens.length - 1].cfg.from, 0);
});

test('a crossfade in the same task as a fresh start fades the outgoing loop from 0, not the stale base', () => {
    const { sm, tweens } = rig();
    sm.fadeAmbientTo('A', 1, 400);
    sm.fadeAmbientTo('B', 1, 400, { crossfade: true });
    const outgoing = tweens.find((t, i) => i > 0 && t.cfg.to === 0);
    assert.ok(outgoing, 'an outgoing fade-out tween exists');
    assert.equal(outgoing.cfg.from, 0);
});

test('play() with an option volume is remembered, so a fade starts from it rather than the stale gain', () => {
    const { sm, tweens } = rig();
    sm.play('A', { volume: 0.4 });
    assert.equal(sm.sounds.A.volume, 1, 'the fake really lags');
    sm.fadeAmbientTo('A', 1, 400);
    assert.equal(tweens[tweens.length - 1].cfg.from, 0.4);
});
