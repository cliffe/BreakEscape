// A new ambient loop fades in from silence. Phaser's WebAudioSound reads `volume` back from
// gain.value, which only catches up with setVolume() once the audio thread has run, so a read
// straight after play() + setVolume(0) still gives the base volume. The fake sound here models
// that lag; the fade must not take its start point from that stale read.
import test from 'node:test';
import assert from 'node:assert/strict';
import SoundManager from '../../public/break_escape/js/systems/sound-manager.js';

function lagSound(key) {
    const s = {
        key, isPlaying: false, loop: false, audioVol: 1, pendingVol: null,
        get volume() { return this.audioVol; },
        setVolume(v) { this.pendingVol = v; },
        playConfig: null,
        play(o) { this.isPlaying = true; this.loop = !!o?.loop; this.playConfig = o; this.audioVol = o?.volume ?? 1; this.pendingVol = null; },
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
    assert.equal(tweens[0].cfg.from, 0);
    assert.equal(sm.sounds.A.volume, 0, 'no stale base-volume read straight after play');
    advance(20);
    assert.ok(sm.sounds.A.volume < 0.2, `volume after 20 ms was ${sm.sounds.A.volume}`);
});

test('a side loop started with fadeLoopTo also fades in from 0', () => {
    const { sm, tweens } = rig();
    sm.fadeLoopTo('B', 0.5, 400);
    assert.equal(tweens[0].cfg.from, 0);
    assert.equal(sm.sounds.B.volume, 0);
});

test('a loop already playing keeps its true current volume as the start of the next fade', () => {
    const { sm, tweens, advance } = rig();
    sm.fadeAmbientTo('A', 1, 400); advance(400);
    const at = sm.sounds.A.volume;
    assert.ok(at > 0.4);
    sm.fadeAmbientTo('A', 0.5, 400);
    assert.equal(tweens[tweens.length - 1].cfg.from, at);
});
