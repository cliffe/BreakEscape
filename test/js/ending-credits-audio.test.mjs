// End-credits audio: only the ending's music plays under the credits, and a reload
// of a concluded game plays the ending's own track (held for the first click or key
// when the browser blocks autoplay; the credits wait for it).
// Run with: node --test test/js/ending-credits-audio.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = (p) => readFileSync(join(js, p), 'utf8');
const fileUrl = (p) => pathToFileURL(join(js, p)).href;
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

// A tiny event target (window / document stand-in).
function target() {
    const map = new Map();
    return {
        addEventListener(t, fn) { if (!map.has(t)) map.set(t, new Set()); map.get(t).add(fn); },
        removeEventListener(t, fn) { map.get(t)?.delete(fn); },
        fire(t, detail) { for (const fn of [...(map.get(t) || [])]) fn({ type: t, detail }); },
        count(t) { return map.get(t)?.size || 0; },
    };
}

// window.eventDispatcher stand-in: handlers get the payload itself.
function dispatcher() {
    const map = new Map();
    return {
        on(t, fn) { if (!map.has(t)) map.set(t, new Set()); map.get(t).add(fn); },
        off(t, fn) { map.get(t)?.delete(fn); },
        fire(t, data) { for (const fn of [...(map.get(t) || [])]) fn(data); },
    };
}

// A Phaser sound stand-in that records what is done to it.
function fakeSound(key, { loop = false, playing = true } = {}) {
    return {
        key, loop, isPlaying: playing, volume: 0.5, calls: [],
        play(cfg) { this.isPlaying = true; if (cfg?.loop) this.loop = true; this.calls.push('play'); },
        stop() { this.isPlaying = false; this.calls.push('stop'); },
        setVolume(v) { this.volume = v; this.calls.push(`vol:${v}`); },
        setLoop(l) { this.loop = l; },
    };
}

globalThis.window = target();
const audio = await import(fileUrl('music/ending-audio.js'));
const SoundManager = (await import(fileUrl('systems/sound-manager.js'))).default;

test('credits starting stops every looping sound and keeps ambience off afterwards', () => {
    audio._resetEndingAudio();
    const sm = new SoundManager({ tweens: { addCounter: () => ({ stop() {} }) } });
    const vent = fakeSound('server_room_ventilation', { loop: true });
    sm.sounds = { server_room_ventilation: vent };
    sm.currentAmbient = 'server_room_ventilation';
    const steps = fakeSound('footsteps', { loop: true });
    const heart = fakeSound('heartbeat', { loop: true });
    const click = fakeSound('ui_click_1');                    // one-shot: left alone
    const idle = fakeSound('lockpick_tension', { loop: true, playing: false });
    const win = { soundManager: sm, game: { sound: { sounds: [vent, steps, heart, click, idle] } } };

    const stopped = audio.silenceBackgroundForEnding({ win, fadeMs: 0 });

    assert.deepEqual(stopped.sort(), ['footsteps', 'heartbeat', 'server_room_ventilation']);
    for (const s of [vent, steps, heart]) assert.equal(s.isPlaying, false, `${s.key} stopped`);
    assert.equal(click.isPlaying, true, 'a one-shot finishes on its own');
    assert.deepEqual(idle.calls, []);
    assert.equal(sm.currentAmbient, null);
    assert.ok(audio.endingSilenced());

    // The credits close and the player walks into the server room: no hum.
    sm.fadeAmbientTo('server_room_ventilation', 1.0);
    sm.playAmbient('server_room_ventilation');
    assert.equal(vent.isPlaying, false, 'ambience does not restart after the ending');
});

test('the silencer fades on timers, since the scene and its tweens are paused', () => {
    const ticks = [];
    const timers = {
        setInterval: (fn) => { ticks.push(fn); return ticks.length; },
        clearInterval: () => { ticks.length = 0; },
    };
    const loop = fakeSound('footsteps', { loop: true });
    audio.silenceBackgroundForEnding({ win: { game: { sound: { sounds: [loop] } } }, fadeMs: 800, timers });
    assert.equal(loop.isPlaying, true, 'still fading');
    const tick = ticks[0];
    for (let i = 0; i < 8; i++) tick();
    assert.equal(loop.isPlaying, false);
    assert.equal(loop.volume, 0);
});

test('the visualiser silences the game whenever it opens with credits', () => {
    const src = read('music/bond-visualiser.js');
    const block = src.slice(src.indexOf('if (opts.credits?.length) {'), src.indexOf('// Record whether we should auto-close'));
    assert.match(block, /silenceBackgroundForEnding\(\)/);
    assert.match(block, /opts\.creditsAfter/);
});

// scenario-music-events.js with MusicController swapped for a fake.
let mc;
const events = [
    { trigger: 'game_loaded', condition: 'globalVars.briefing_played === true', playlist: 'noir' },
    { trigger: 'global_variable_changed:night_closed', condition: "value === true && globalVars.ending === 'arrest'",
      playlist: 'victory', autoStop: true, credits: [{ text: 'MISSION COMPLETE', style: 'title' }] },
    { trigger: 'global_variable_changed:night_closed', condition: "value === true && globalVars.ending === 'lethal'",
      playlist: 'end', autoStop: true, credits: [{ text: 'MISSION COMPLETE', style: 'title' }] },
    { trigger: 'conversation_closed:closing_debrief_person', playlist: 'victory', track: 'Ghost in the Wire',
      autoStop: true, credits: [{ text: 'MISSION COMPLETE', style: 'title' }] },
];
function fakeMc(state = 'running') {
    const m = {
        isLeader: true, calls: [], context: { state },
        playTrack(t, p, f) { this.calls.push(['playTrack', t, p, f]); },
        switchPlaylist(p, f) { this.calls.push(['switchPlaylist', p, f]); },
        stopAfterCurrentTrack() { this.calls.push(['stopAfter']); },
        startDefault() { this.calls.push(['startDefault']); },
        getState() { return this.state || {}; },
    };
    m.context.resume = () => { m.context.state = 'running'; m.calls.push(['resume']); return Promise.resolve(); };
    return m;
}
const src = read('music/scenario-music-events.js')
    .replace("import MusicController from './music-controller.js';", 'const MusicController = globalThis.__mc;')
    .replace("'./closing-sequence.js'", `'${fileUrl('music/closing-sequence.js')}'`)
    .replace("'./ending-audio.js'", `'${fileUrl('music/ending-audio.js')}'`)
    .replace("'./music-config.js'", `'${fileUrl('music/music-config.js')}'`)
    .replace("'./conclude-mission.js'", `'${fileUrl('music/conclude-mission.js')}'`);
globalThis.__mc = new Proxy({}, { get: (_, k) => (typeof mc[k] === 'function' ? mc[k].bind(mc) : mc[k]) });
const sme = await import(dataUrl(src));
const tick = () => new Promise(r => setTimeout(r, 0));

function setup(globals, state = 'running') {
    mc = fakeMc(state);
    sme._resetEndingMusicLock();
    const win = target();
    const doc = target();
    win.gameState = { globalVariables: globals };
    win.BondVisualiser = { setAutoOpenSuppressed() {} };
    globalThis.window = win;
    return { win, doc, deps: { mc, win, doc } };
}

test('the replay plays the track of the ending the saved globals chose', async () => {
    for (const [ending, playlist] of [['arrest', 'victory'], ['lethal', 'end']]) {
        const { win, deps } = setup({ night_closed: true, ending });
        const opts = sme.startEndingReplayMusic({ music: { events } }, undefined, deps);
        assert.deepEqual(mc.calls.slice(0, 2), [['switchPlaylist', playlist, false], ['stopAfter']], ending);
        assert.equal(opts.autoStop, true);
        let done = false; opts.creditsAfter.then(() => { done = true; });
        await tick();
        assert.equal(done, false, 'credits wait for the track to start');
        win.fire('musiccontroller:trackchange', { title: 'x' });
        assert.equal(await opts.creditsAfter, 'started');
    }
    // m01's shape: a named track in a playlist.
    const { win, deps } = setup({ briefing_played: true });
    const opts = sme.startEndingReplayMusic({ music: { events: [events[0], events[3]] } }, undefined, deps);
    assert.deepEqual(mc.calls[0], ['playTrack', 'Ghost in the Wire', 'victory', false]);
    win.fire('musiccontroller:trackchange', {});
    assert.equal(await opts.creditsAfter, 'started');
});

test('after the replay starts, the mission\'s game_loaded mood does not replace the end track', () => {
    const { deps } = setup({ night_closed: true, ending: 'arrest', briefing_played: true });
    const disp = dispatcher();
    window.eventDispatcher = disp;
    sme.initScenarioMusicEvents({ music: { events } });
    sme.startEndingReplayMusic({ music: { events } }, undefined, deps);
    disp.fire('game_loaded', {});
    assert.deepEqual(mc.calls.map(c => c[0]), ['switchPlaylist', 'stopAfter'], 'no noir after the ending');
    assert.equal(sme.endingOwnsMusic(), true);
});

test('with autoplay blocked, the track waits for the first gesture and the credits wait for the track', async () => {
    const { win, doc, deps } = setup({ night_closed: true, ending: 'lethal' }, 'suspended');
    const opts = sme.startEndingReplayMusic({ music: { events } }, undefined, deps);
    let done = false; opts.creditsAfter.then(() => { done = true; });
    win.fire('musiccontroller:trackchange', {});   // buffer decoded, but the context is suspended
    await tick();
    assert.equal(done, false, 'no credits while the browser holds the audio');
    assert.ok(doc.count('keydown') > 0, 'listening for the first key');
    doc.fire('keydown', {});
    assert.equal(await opts.creditsAfter, 'started');
    assert.ok(mc.calls.some(c => c[0] === 'resume'), 'the gesture resumed the AudioContext');
    assert.equal(doc.count('keydown'), 0, 'gesture listeners removed');
});

test('playEndingMusic waits to lead before playing in a follower tab', async () => {
    const { win, doc } = setup({});
    mc.isLeader = false; mc.requestLeadership = () => mc.calls.push(['requestLeadership']);
    audio.playEndingMusic({ playlist: 'end' }, { mc, win, doc });
    assert.deepEqual(mc.calls, [['requestLeadership']]);
    win.fire('musiccontroller:leaderchange', { isLeader: true });
    assert.deepEqual(mc.calls[1], ['switchPlaylist', 'end', false]);
});

test('a replayed conclusion starts the ending music and hands the credits its wait', async () => {
    const om = await import(dataUrl(read('systems/objectives-manager.js')));
    const opened = [];
    const ready = Promise.resolve('started');
    let started = 0;
    globalThis.window = {
        BondVisualiser: { open: (o) => opened.push(o) },
        gameScenario: { music: { events } },
        endingReplayOptions: () => ({ credits: [{ text: 'MISSION COMPLETE' }] }),
        startEndingReplayMusic: () => { started++; return { creditsAfter: ready, autoStop: true }; },
    };
    const mgr = Object.create(om.ObjectivesManager?.prototype ?? om.default.prototype);
    mgr.eventDispatcher = { emit() {} };
    const aim = { aimId: 'end', conclusionScreen: { type: 'bond_visualiser' } };
    mgr.handleMissionConcluded(aim, { replay: true });
    assert.equal(started, 1);
    assert.equal(opened[0].creditsAfter, ready);
    mgr.handleMissionConcluded(aim);
    assert.equal(started, 1, 'the live path leaves the music to its event');
});

test('a live ending that fires before any gesture (m10 catch-up on load) holds its credits too', async () => {
    const { win, doc } = setup({ night_closed: true, ending: 'arrest' }, 'suspended');
    globalThis.document = doc;
    const opened = [];
    win.BondVisualiser = { setAutoOpenSuppressed() {}, open: (o) => opened.push(o) };
    const disp = dispatcher();
    win.eventDispatcher = disp;
    sme.initScenarioMusicEvents({ music: { events } });
    disp.fire('global_variable_changed:night_closed', { name: 'night_closed', value: true });
    for (let i = 0; i < 5 && !opened.length; i++) await tick();
    assert.equal(opened.length, 1, 'credits opened once the (absent) server agreed');
    assert.ok(opened[0].creditsAfter, 'credits wait for the audio');
    let done = false; opened[0].creditsAfter.then(() => { done = true; });
    win.fire('musiccontroller:trackchange', {});
    await tick();
    assert.equal(done, false);
    doc.fire('pointerdown', {});
    assert.equal(await opened[0].creditsAfter, 'started');
    delete globalThis.document;
});

test('a live ending in a running context opens its credits straight away', async () => {
    const { win } = setup({ night_closed: true, ending: 'lethal' }, 'running');
    const opened = [];
    win.BondVisualiser = { setAutoOpenSuppressed() {}, open: (o) => opened.push(o) };
    const disp = dispatcher();
    win.eventDispatcher = disp;
    sme.initScenarioMusicEvents({ music: { events } });
    disp.fire('global_variable_changed:night_closed', { name: 'night_closed', value: true });
    for (let i = 0; i < 5 && !opened.length; i++) await tick();
    assert.equal(opened[0].creditsAfter, undefined);
    assert.deepEqual(mc.calls[0], ['switchPlaylist', 'end', true]);
});

// Shuffled ending playlists: the reload plays the song the live ending played.
test('the live ending records the song it plays in a saved global', async () => {
    const { win } = setup({ night_closed: true, ending: 'arrest' }, 'running');
    let synced = 0;
    win.stateSync = { sync: async () => { synced++; } };
    win.BondVisualiser = { setAutoOpenSuppressed() {}, open() {} };
    mc.switchPlaylist = function (p, f) { this.calls.push(['switchPlaylist', p, f]); this.state = { playlist: p, trackTitle: 'Cipher Tide' }; };
    const disp = dispatcher();
    win.eventDispatcher = disp;
    sme.initScenarioMusicEvents({ music: { events } });
    disp.fire('global_variable_changed:night_closed', { name: 'night_closed', value: true });
    // Set before the conclude request, whose syncs save it (no game id here, so none run).
    assert.equal(win.gameState.globalVariables[sme.ENDING_TRACK_GLOBAL], 'Cipher Tide');
    assert.equal(synced, 0, 'no extra sync on the leader path');
});

test('a follower tab records the song when its track starts, and saves it', () => {
    const { win } = setup({ night_closed: true, ending: 'arrest' }, 'running');
    let synced = 0;
    win.stateSync = { sync: async () => { synced++; } };
    win.BondVisualiser = { setAutoOpenSuppressed() {}, open() {} };
    mc.isLeader = false;
    mc.state = { playlist: 'cutscene', trackTitle: 'Shadow Code 0' };
    const disp = dispatcher();
    win.eventDispatcher = disp;
    sme.initScenarioMusicEvents({ music: { events } });
    disp.fire('global_variable_changed:night_closed', { name: 'night_closed', value: true });
    assert.equal(win.gameState.globalVariables[sme.ENDING_TRACK_GLOBAL], undefined);
    win.fire('musiccontroller:trackchange', { title: 'Digital Leashes', playlist: 'victory' });
    assert.equal(win.gameState.globalVariables[sme.ENDING_TRACK_GLOBAL], 'Digital Leashes');
    assert.equal(synced, 1);
});

test('the replay plays the recorded song; an unknown or missing one falls back to the playlist', () => {
    let { deps } = setup({ night_closed: true, ending: 'arrest', [sme.ENDING_TRACK_GLOBAL]: 'Cipher Tide' });
    sme.startEndingReplayMusic({ music: { events } }, undefined, deps);
    assert.deepEqual(mc.calls[0], ['playTrack', 'Cipher Tide', 'victory', false]);

    ({ deps } = setup({ night_closed: true, ending: 'arrest', [sme.ENDING_TRACK_GLOBAL]: 'Not A Song' }));
    sme.startEndingReplayMusic({ music: { events } }, undefined, deps);
    assert.deepEqual(mc.calls[0], ['switchPlaylist', 'victory', false]);

    // A song from another playlist (a later ending's) is not forced onto this one.
    ({ deps } = setup({ night_closed: true, ending: 'lethal', [sme.ENDING_TRACK_GLOBAL]: 'Cipher Tide' }));
    sme.startEndingReplayMusic({ music: { events } }, undefined, deps);
    assert.deepEqual(mc.calls[0], ['switchPlaylist', 'end', false]);
});
