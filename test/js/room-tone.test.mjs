// Room tone (OFFICE_LIFE_PLAN 12.6, slice 20): the pure bed choice, the sound manager's crossfade,
// turn-back, duck and unknown-key fade, the profile table, typing, spots, and startSound /
// outputSound behind roomTone.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chooseAmbient, OPEN_BLEED, SHUT_BLEED } from '../../public/break_escape/js/systems/ambient-choice.js';
import SoundManager from '../../public/break_escape/js/systems/sound-manager.js';
import {
    profileIdFor, profileForRoom, typingLevel, duckWanted, spotFor, typistsIn, setRoomToneTable, OfficeRoomTone, SPOT_SLOT_MS
} from '../../public/break_escape/js/systems/office-room-tone.js';
import { NpcOfficeVisuals } from '../../public/break_escape/js/systems/npc-office-visuals.js';
import { NPCNeedsSystem } from '../../public/break_escape/js/systems/npc-needs.js';
import { runSimsDay } from './fixtures/needs-sims-world.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const TABLE = JSON.parse(readFileSync(join(root, 'public/break_escape/js/data/room-tones.json'), 'utf8'));
const loaded = (...keys) => (k) => keys.includes(k);

// ── the pure choice ──────────────────────────────────────────────────────────

// The old recalculateAmbientVolume loop, verbatim in logic, as the reference for roomTone off
function oldChoice(rooms, playerRoom, link) {
    for (const [roomId, rd] of Object.entries(rooms)) {
        if (!rd.ambientSound) continue;
        if (playerRoom === roomId) return { key: rd.ambientSound, level: rd.ambientVolume ?? 1.0 };
        const l = link(roomId);
        if (l.adjacent) return { key: rd.ambientSound, level: l.open ? 0.125 : 0.01 };
    }
    return { key: null };
}

test('without roomTone the choice is exactly the old rooms-order loop (sis01-like rooms, every room and the null room)', () => {
    const rooms = {
        ward_7: { type: 'room_office', ambientSound: 'hospital_ambient' },
        it_security_office: { type: 'room_office', ambientSound: 'server_room_ventilation', ambientVolume: 0.25 },
        major_incident_room: { type: 'room_meeting', ambientSound: 'office_ambient', ambientVolume: 0.5 },
        corridor: { type: 'room_office' }
    };
    const adj = { ward_7: ['it_security_office'], it_security_office: ['ward_7', 'major_incident_room'], major_incident_room: ['it_security_office'], corridor: [] };
    for (const open of [true, false]) {
        for (const player of [...Object.keys(rooms), null]) {
            const link = (id) => ({ adjacent: !!player && (adj[player] || []).includes(id), open });
            const got = chooseAmbient({ rooms, playerRoom: player, link, roomTone: false, isLoaded: () => false });
            const want = oldChoice(rooms, player, link);
            assert.equal(got.key, want.key, `${player} open=${open}`);
            if (want.key) assert.equal(got.level, want.level);
        }
    }
    // it_security_office reaches ward_7's unloaded key first (the one shipped change is in the sound manager)
    assert.equal(chooseAmbient({ rooms, playerRoom: 'it_security_office', link: (id) => ({ adjacent: id === 'ward_7' }) }).key, 'hospital_ambient');
});

test('with roomTone: a null room keeps the bed; the four-step order; an unloaded key is no bed', () => {
    const rooms = {
        server: { type: 'room_servers', ambientSound: 'server_room_ventilation', ambientVolume: 0.4 },
        it_room: { type: 'room_it' },
        meeting: { type: 'room_meeting' },
        ward: { type: 'room_office', ambientSound: 'hospital_ambient' }
    };
    const scen = { rooms };
    const profileFor = (id) => profileForRoom(id, scen, TABLE);
    const isLoaded = loaded('server_room_ventilation', 'office_ambient', 'kitchen_tone');
    const link = (player) => (id) => ({ adjacent: (player === 'it_room' && id === 'server') || (player === 'meeting' && id === 'server'), open: false });
    const c = (player) => chooseAmbient({ rooms, playerRoom: player, link: link(player), roomTone: true, profileFor, isLoaded });
    assert.deepEqual(c(null), { keep: true });
    assert.deepEqual(c('server'), { key: 'server_room_ventilation', level: 0.4, step: 1 }, '1. own authored loop at its level');
    assert.deepEqual(c('it_room'), { key: 'office_ambient', level: 0.8, step: 2 }, '2. profile bed replaces the bleed');
    assert.deepEqual(c('meeting'), { key: 'server_room_ventilation', level: SHUT_BLEED, step: 3 }, '3. a neighbour\'s authored loop (meeting has no bed)');
    assert.deepEqual(c('ward'), { key: 'office_ambient', level: 1, step: 2 }, 'an unloaded authored key falls to the profile bed');
    // before the table loads there is no profile: no bed (step 4), refreshAmbient after it gives the bed
    assert.equal(chooseAmbient({ rooms, playerRoom: 'it_room', link: () => ({}), roomTone: true, profileFor: () => null, isLoaded }).key, null);
});

test('with roomTone: two authored neighbours prefer the open door, then rooms order; profile beds never bleed', () => {
    const rooms = {
        hall_1: { type: 'x', ambientSound: 'a_loop' },
        hall_2: { type: 'x', ambientSound: 'b_loop' },
        control: { type: 'y' },
        office: { type: 'room_office' }
    };
    const both = (openId) => (id) => ({ adjacent: id === 'hall_1' || id === 'hall_2', open: id === openId });
    const base = { rooms, playerRoom: 'control', roomTone: true, profileFor: () => null, isLoaded: () => true };
    assert.deepEqual(chooseAmbient({ ...base, link: both('hall_2') }), { key: 'b_loop', level: OPEN_BLEED, step: 3 });
    assert.deepEqual(chooseAmbient({ ...base, link: both(null) }), { key: 'a_loop', level: SHUT_BLEED, step: 3 });
    // an office neighbour's bed is not heard: only authored loops bleed
    const off = chooseAmbient({ rooms: { office: { type: 'room_office' }, meet: { type: 'room_meeting' } }, playerRoom: 'meet', roomTone: true,
        link: () => ({ adjacent: true, open: true }), profileFor: (id) => profileForRoom(id, { rooms: { office: { type: 'room_office' }, meet: { type: 'room_meeting' } } }, TABLE), isLoaded: () => true });
    assert.equal(off.key, null);
});

// ── the sound manager ───────────────────────────────────────────────────────

function fakeScene() {
    const tweens = [];
    const scene = {
        tweens: {
            addCounter(cfg) {
                const t = { cfg, elapsed: 0, done: false, stopped: false, stop() { this.stopped = true; } };
                tweens.push(t);
                return t;
            }
        }
    };
    const advance = (ms) => {
        for (const t of tweens.slice()) {
            if (t.done || t.stopped) continue;
            t.elapsed = Math.min(t.cfg.duration, t.elapsed + ms);
            const v = t.cfg.from + (t.cfg.to - t.cfg.from) * (t.cfg.duration ? t.elapsed / t.cfg.duration : 1);
            t.cfg.onUpdate?.({ getValue: () => v });
            if (t.elapsed >= t.cfg.duration) { t.done = true; t.cfg.onComplete?.(); }
        }
    };
    return { scene, advance, tweens };
}
function fakeSound(key) {
    return { key, isPlaying: false, volume: 0, loop: false, setVolume(v) { this.volume = v; }, play(o) { this.isPlaying = true; this.loop = !!o?.loop; }, stop() { this.isPlaying = false; } };
}
function manager(keys = ['A', 'B', 'C', 'typing_loop']) {
    const { scene, advance, tweens } = fakeScene();
    const sm = new SoundManager(scene);
    for (const k of keys) sm.sounds[k] = fakeSound(k);
    return { sm, advance, tweens, s: sm.sounds };
}
const near = (a, b) => Math.abs(a - b) < 1e-9;
const XF = { crossfade: true };

test('crossfade: A to B to A inside 400 ms leaves A playing at its level and B stopped', () => {
    const { sm, advance, s } = manager();
    sm.fadeAmbientTo('A', 1, 400, XF); advance(400);
    assert.ok(near(s.A.volume, 0.5));
    sm.fadeAmbientTo('B', 1, 400, XF); advance(100);
    assert.ok(s.A.isPlaying && s.A.volume < 0.5, 'A fades out, still playing');
    assert.equal(sm._outgoing, 'A');
    sm.fadeAmbientTo('A', 1, 400, XF); advance(100);
    assert.equal(sm._outgoing, 'B', 'B is now the outgoing one');
    advance(400);
    assert.ok(s.A.isPlaying && near(s.A.volume, 0.5), 'A back at its level');
    assert.equal(s.B.isPlaying, false);
    assert.equal(sm.currentAmbient, 'A');
});

test('crossfade: A to B to C leaves only C; then C to A inside the fades leaves A playing', () => {
    const { sm, advance, s } = manager();
    sm.fadeAmbientTo('A', 1, 400, XF); advance(400);
    sm.fadeAmbientTo('B', 1, 400, XF); advance(100);
    sm.fadeAmbientTo('C', 1, 400, XF);
    assert.equal(s.A.isPlaying, false, 'the older outgoing loop stops at once');
    advance(100);
    sm.fadeAmbientTo('A', 1, 400, XF); advance(600);
    assert.ok(s.A.isPlaying && near(s.A.volume, 0.5));
    assert.equal(s.B.isPlaying, false); assert.equal(s.C.isPlaying, false);
    // and plain A to B to C
    const m2 = manager();
    m2.sm.fadeAmbientTo('A', 1, 400, XF); m2.advance(400);
    m2.sm.fadeAmbientTo('B', 1, 400, XF); m2.advance(100);
    m2.sm.fadeAmbientTo('C', 1, 400, XF); m2.advance(500);
    assert.deepEqual(['A', 'B', 'C'].filter(k => m2.s[k].isPlaying), ['C']);
});

test('crossfade to silence (a meeting room) can turn back too', () => {
    const { sm, advance, s } = manager();
    sm.fadeAmbientTo('A', 1, 400, XF); advance(400);
    sm.fadeAmbientTo('A', 0, 400, XF); advance(200);
    assert.equal(sm.currentAmbient, null); assert.equal(sm._outgoing, 'A');
    sm.fadeAmbientTo('A', 1, 400, XF); advance(500);
    assert.ok(s.A.isPlaying && near(s.A.volume, 0.5));
});

test('an unknown key fades the current loop out (volume-0 path), never cuts it; the previous key inside 400 ms keeps playing', () => {
    const { sm, advance, s } = manager();
    sm.fadeAmbientTo('A', 1); advance(400);
    sm.fadeAmbientTo('hospital_ambient', 0.125);
    assert.ok(s.A.isPlaying, 'not cut');
    advance(200);
    assert.ok(s.A.isPlaying && s.A.volume < 0.5 && s.A.volume > 0);
    sm.fadeAmbientTo('A', 1); advance(600);
    assert.ok(s.A.isPlaying && near(s.A.volume, 0.5), 'stepping back finds it playing and tweens it up');
    // left alone, it fades to silence and stops
    sm.fadeAmbientTo('hospital_ambient', 0.125); advance(500);
    assert.equal(s.A.isPlaying, false);
    assert.equal(sm.currentAmbient, null);
    // with no current loop it does nothing
    sm.fadeAmbientTo('hospital_ambient', 1);
    assert.equal(sm.currentAmbient, null);
});

test('without crossfade a key change still stops the old loop at once (unchanged)', () => {
    const { sm, advance, s } = manager();
    sm.fadeAmbientTo('A', 1); advance(400);
    sm.fadeAmbientTo('B', 0.125);
    assert.equal(s.A.isPlaying, false);
    assert.equal(sm._outgoing ?? null, null);
});

test('the duck halves the bed and the typing loop, and survives a recalculation', () => {
    const { sm, advance, s } = manager();
    sm.fadeAmbientTo('A', 1, 400, XF); sm.fadeLoopTo('typing_loop', 0.6); advance(400);
    sm.setAmbientDuck(0.5); advance(400);
    assert.ok(near(s.A.volume, 0.25)); assert.ok(near(s.typing_loop.volume, 0.15));
    sm.fadeAmbientTo('A', 1, 400, XF); advance(400);   // a room change or door event re-asks
    assert.ok(near(s.A.volume, 0.25), 'the duck is kept');
    sm.setAmbientDuck(1); advance(400);
    assert.ok(near(s.A.volume, 0.5)); assert.ok(near(s.typing_loop.volume, 0.3));
    sm.fadeLoopTo('typing_loop', 0); advance(400);
    assert.equal(s.typing_loop.isPlaying, false);
    sm.suppressAmbience(true);
    assert.equal(sm._outgoing, null);
});

// ── the profile table, typing, ducking, spots ───────────────────────────────

test('profiles: exact type, the scenario map, unknown types none; the seven defaults', () => {
    assert.equal(profileIdFor('room_office', {}, TABLE), 'office');
    assert.equal(profileIdFor('room_lw_accounts', { roomToneTypes: { room_lw_accounts: 'office' } }, TABLE), 'office');
    assert.equal(profileIdFor('room_lw_accounts', {}, TABLE), null);
    assert.equal(profileIdFor('room_x', { roomToneTypes: { room_x: 'nope' } }, TABLE), null);
    assert.equal(profileIdFor('room_office', {}, null), null, 'no table: no profile');
    assert.deepEqual(Object.keys(TABLE.types).sort(), ['room_break', 'room_ceo', 'room_it', 'room_meeting', 'room_office', 'room_reception', 'room_servers']);
    assert.equal(TABLE.profiles.meeting.bed, null);
});

test('typing: louder with more typists, capped at three; counted per room', () => {
    assert.equal(typingLevel(0), 0);
    assert.ok(typingLevel(1) < typingLevel(2) && typingLevel(2) < typingLevel(3));
    assert.equal(typingLevel(7), typingLevel(3));
    const m = new Map([['a', 'office'], ['b', 'office'], ['c', 'kitchen']]);
    assert.equal(typistsIn(m, 'office'), 2);
    assert.equal(typistsIn(m, 'lounge'), 0);
});

test('ducking: a heard line or an open chat, not a line the player does not hear', () => {
    assert.equal(duckWanted({ clockMs: 1000, heardUntil: 3000 }), true);
    assert.equal(duckWanted({ clockMs: 4000, heardUntil: 3000 }), false);
    assert.equal(duckWanted({ clockMs: 0, heardUntil: 0, chatOpen: true }), true);
    // _speak sets _heardUntil only for an overheard line
    const sys = new NPCNeedsSystem({ npcIds: () => [], emit() {}, getObject: () => null }, { seed: 's' });
    sys._speak('tom', 'hello', 5000, { overheard: false });
    assert.ok(!(sys._heardUntil > 0));
    sys._speak('tom', 'hello', 5000, { overheard: true });
    assert.equal(sys._heardUntil, 5000);
});

test('spots: seeded, filtered by what the room holds; no distant phone with a desk phone', () => {
    const office = { ...TABLE.profiles.office };
    const run = (holds) => Array.from({ length: 60 }, (_, slot) => spotFor({ seed: 'x', roomId: 'office', slot, profile: office, holds }));
    const a = run({ copier: true }), b = run({ copier: true });
    assert.deepEqual(a, b, 'same seed, same spots');
    assert.ok(a.includes('copier_run') && a.includes('distant_phone') && a.includes(null));
    assert.ok(!run({ copier: false }).includes('copier_run'));
    assert.ok(!run({ copier: true, deskPhone: true }).includes('distant_phone'));
    assert.deepEqual(run({ copier: false, deskPhone: true }).filter(Boolean), []);
    assert.equal(spotFor({ seed: 'x', roomId: 'kitchen', slot: 1, profile: TABLE.profiles.kitchen }), null);
});

// ── the runtime pieces with a fake window ───────────────────────────────────

function fakeWindow({ roomTone = true, room = 'office', objects = {} } = {}) {
    const played = [];
    const scene = { sound: { mute: false, play: (key, o) => played.push({ key, volume: o.volume }) }, cache: { audio: { exists: () => true } } };
    const objs = {
        coffee: { id: 'coffee', roomId: 'office', x: 100, y: 100, affordance: { startSound: 'coffee_machine' } },
        copier: { id: 'copier', roomId: 'office', x: 120, y: 100, affordance: { outputSound: 'copier_run' } },
        kcopier: { id: 'kcopier', roomId: 'kitchen', x: 900, y: 100, affordance: { outputSound: 'copier_run' } },
        ...objects
    };
    globalThis.window = {
        gameScenario: { roomTone, rooms: { office: { type: 'room_office' }, kitchen: { type: 'room_break' } } },
        currentPlayerRoom: room,
        player: { x: 110, y: 110 },
        soundManager: { enabled: true, volumeSettings: { effects: 1 }, masterVolume: 1 },
        npcNeedsSystem: { world: { getObject: (id) => objs[id] || null } },
        npcBehaviorManager: { getBehavior: () => ({ sprite: { x: 100, y: 110 }, roomId: 'office' }) }
    };
    return { vis: new NpcOfficeVisuals(scene), played };
}

test('startSound and outputSound: silent without roomTone; outputSound only with a producerId, a cosmetic copy included', () => {
    let { vis, played } = fakeWindow({ roomTone: false });
    assert.equal(vis.onUseStarted({ npcId: 'tom', objectId: 'coffee' }), 0);
    assert.equal(vis.onRevealed({ producerId: 'copier', objectId: 'slot_a' }), 0);
    assert.equal(played.length, 0);
    ({ vis, played } = fakeWindow({ roomTone: true }));
    assert.ok(vis.onUseStarted({ npcId: 'tom', objectId: 'coffee' }) > 0);
    assert.equal(played[0].key, 'coffee_machine');
    vis.limiters.clear();
    assert.equal(vis.onRevealed({ npcId: 'tom', objectId: 'badge', leftBehindBy: 'tom' }), 0, 'a left-behind reveal stays silent');
    assert.ok(vis.onRevealed({ producerId: 'copier', npcId: 'tom', objectId: 'copier', cosmetic: true }) > 0);
    assert.equal(played.at(-1).key, 'copier_run');
    assert.equal(vis.playLog.at(-1).cosmetic, true);
    vis.limiters.clear();
    assert.equal(vis.onRevealed({ producerId: 'kcopier', objectId: 'k_slot' }), 0, 'another room: not heard');
});

test('npc_use_started fires once per use, at the using start; the sims day log is unchanged by it', () => {
    const { sys, w } = runSimsDay(NPCNeedsSystem, { minutes: 15 });
    const started = w.calls.emits.filter(e => e.name.startsWith('npc_use_started:'));
    const usingLogs = sys.getLog().filter(e => e.ev === 'using');   // needs uses and carry drops alike
    assert.ok(started.length > 5);
    assert.equal(started.length, usingLogs.length);
    for (const e of started) assert.ok(e.data.npcId && e.data.objectId && e.name === `npc_use_started:${e.data.objectId}`);
    assert.deepEqual(started.map(e => `${e.data.npcId}>${e.data.objectId}`), usingLogs.map(e => `${e.npc}>${e.target}`), 'one per using, in order');
});

test('the room tone runtime: duck on a heard line, typing by count, started once per room, spots on the clock', () => {
    setRoomToneTable(TABLE);
    const calls = [];
    const emitted = [];
    globalThis.window = {
        gameScenario: { roomTone: true, rooms: { office: { type: 'room_office' }, lounge: { type: 'room_meeting' } } },
        currentPlayerRoom: 'office',
        rooms: { office: { objects: { c: { scenarioData: { type: 'photocopier1' }, x: 1, y: 1 } } } },
        officeTypists: new Map([['a', 'office'], ['b', 'office'], ['c', 'office'], ['d', 'office']]),
        soundManager: { currentAmbient: 'office_ambient', setAmbientDuck: (m) => calls.push(['duck', m]), fadeLoopTo: (k, l) => calls.push(['loop', k, l]) },
        npcNeedsSystem: { clockMs: 1000, _heardUntil: 3000, seed: 'x' },
        ambientChoice: { room: 'office', key: 'office_ambient', level: 1, step: 2 },
        eventDispatcher: { emit: (n, d) => emitted.push(n) },
        npcOfficeVisuals: { playAt: () => 0.1 }, player: { x: 0, y: 0 }
    };
    const rt = new OfficeRoomTone();
    rt.update(1000);
    assert.deepEqual(calls.find(c => c[0] === 'duck'), ['duck', 0.5]);
    assert.deepEqual(calls.find(c => c[0] === 'loop'), ['loop', 'typing_loop', typingLevel(3)], 'four typists play as three');
    assert.deepEqual(emitted, ['room_tone_started:office']);
    window.npcNeedsSystem.clockMs = 4000; rt.update(2000);
    assert.deepEqual(calls.filter(c => c[0] === 'duck').map(c => c[1]), [0.5, 1]);
    assert.deepEqual(emitted, ['room_tone_started:office'], 'once per room');
    // the room has no typing in a meeting room; a doorway leaves it as it is
    window.currentPlayerRoom = null; rt.update(3000);
    assert.equal(rt.typing, 3);
    window.currentPlayerRoom = 'lounge'; rt.update(4000);
    assert.equal(rt.typing, 0);
    // spots: one roll per slot change
    window.currentPlayerRoom = 'office';
    let spots = 0;
    for (let i = 1; i <= 40; i++) { window.npcNeedsSystem.clockMs = 4000 + i * SPOT_SLOT_MS; rt.update(5000 + i * 300); }
    spots = rt.log.filter(e => e.what === 'spot').length;
    assert.ok(spots > 5 && spots < 40, `spots ${spots}`);
});
