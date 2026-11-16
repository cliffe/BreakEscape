// A hostile hidden by a setVisible:false mapping cannot attack, so it must not keep the
// fight music going (anyHostilesAlive in music/scenario-music-events.js). A hostile that
// merely starts hidden has no recorded visibility and still counts, as before.
// Real sources in jsdom. Run with: node --max-old-space-size=2048 --test test/js/hostiles-hidden-music.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
['log', 'info', 'warn', 'debug'].forEach((k) => { console[k] = () => {}; });
window.gameState = { globalVariables: {} };

// MusicController returns window.MusicController when set, so no AudioContext is needed
const switches = [];
window.MusicController = { switchPlaylist: (name) => { switches.push(name); }, startDefault() {}, getState: () => ({}), isLeader: () => true };

const imp = (rel) => import(pathToFileURL(join(js, rel)));
const NPCManager = (await imp('systems/npc-manager.js')).default;
const { NPCBehaviorManager, NPCBehavior } = await imp('systems/npc-behavior.js');
const { initScenarioMusicEvents } = await imp('music/scenario-music-events.js');

function bus() {
    const h = {};
    return {
        on: (e, f) => { (h[e] ||= []).push(f); },
        off: (e, f) => { h[e] = (h[e] || []).filter((x) => x !== f); },
        emit: (e, d) => (h[e] || []).slice().forEach((f) => f(d))
    };
}

// A real NPCManager and a real NPCBehaviorManager.setNPCVisible, so a setVisible mapping goes
// through the same path as in play. Hostility is a stub that also records announcements.
const announced = [];
function setup(ids, { hostile = ids, ko = [], threat = false } = {}) {
    hostile = [...hostile];
    window.eventDispatcher = bus();
    const m = new NPCManager(window.eventDispatcher, null);
    ids.forEach((id) => m.npcs.set(id, { id, npcType: 'person', isVisible: true }));
    window.npcManager = m;
    const bm = Object.create(NPCBehaviorManager.prototype);
    bm.behaviors = new Map();
    window.npcBehaviorManager = bm;
    const sys = {
        isNPCHostile: (id) => hostile.includes(id),
        isNPCKO: (id) => ko.includes(id),
        // what the real hostile system does on a turn: record it and announce it once
        setNPCHostile: (id, h) => {
            if (h && !hostile.includes(id)) {
                hostile.push(id);
                window.eventDispatcher.emit('npc_hostile_state_changed', { npcId: id, isHostile: true });
            }
        },
        announceRestoredHostile: (id) => { announced.push(id); return true; }
    };
    window.npcHostileSystem = sys;
    announced.length = 0;
    switches.length = 0;
    initScenarioMusicEvents({ music: { events: [
        ...(threat ? [{ trigger: 'npc_hostile_state_changed', condition: 'isHostile === true', playlist: 'threat', fade: false }] : []),
        { trigger: 'all_hostiles_ko', playlist: 'calm', fade: true }
    ] } });
    return { m, bm, sys, ko, hostile };
}
// Mapping on `id`: hides it when global `night` becomes true, shows it on `day`
function mapHide(m, id) {
    m._setupEventMappings(id, [
        { eventPattern: 'global_variable_changed:night', condition: 'value === true', cooldown: 0, setVisible: false },
        { eventPattern: 'global_variable_changed:day', condition: 'value === true', cooldown: 0, setVisible: true }
    ]);
}
const night = () => window.eventDispatcher.emit('global_variable_changed:night', { value: true });
const day = () => window.eventDispatcher.emit('global_variable_changed:day', { value: true });
const koEvent = (id, ctx) => { ctx.ko.push(id); window.eventDispatcher.emit('npc_ko', { npcId: id }); };

test('hide first, KO second: a hostile hidden by a mapping no longer holds the fight music', () => {
    const c = setup(['a', 'b']); mapHide(c.m, 'b');
    night();
    assert.deepEqual(switches, [], 'a is still conscious and visible: still fighting');
    koEvent('a', c);
    assert.deepEqual(switches, ['calm'], 'a was the last visible hostile; hidden b does not count');
});

test('M1: KO first, hide second ends the fight (no npc_ko follows the hide)', () => {
    const c = setup(['a', 'b']); mapHide(c.m, 'b');
    koEvent('a', c);
    assert.deepEqual(switches, []);
    night();
    assert.deepEqual(switches, ['calm']);
    assert.equal(c.m.isHiddenByMapping('b'), true, 'recorded by the real mapping path');
});

test('hiding one hostile while another is still conscious and visible keeps the fight', () => {
    const c = setup(['a', 'b']); mapHide(c.m, 'b');
    night();
    assert.deepEqual(switches, []);
    koEvent('a', c);
    assert.deepEqual(switches, ['calm'], 'positive control: b is hidden, a was the last visible hostile');
});

test('hiding a peaceful NPC, or a KO\'d hostile, does not switch the playlist', () => {
    const c = setup(['a', 'b'], { hostile: ['a'], ko: ['b'] }); mapHide(c.m, 'b');
    night();
    assert.deepEqual(switches, [], 'b is not a counted hostile');
    const d = setup(['a', 'b'], { hostile: ['a'] }); mapHide(d.m, 'b');
    night();
    assert.deepEqual(switches, [], 'b is peaceful');
    koEvent('a', d);
    assert.deepEqual(switches, ['calm'], 'positive control: handler is live');
});

test('a hostile revealed again counts again, and is announced so the fight music returns', () => {
    const c = setup(['a', 'b']); mapHide(c.m, 'b');
    night(); day();
    assert.deepEqual(announced, ['b'], 'm1: the reveal re-announces the hostile');
    assert.equal(c.m.isHiddenByMapping('b'), false);
    koEvent('a', c);
    assert.deepEqual(switches, [], 'b counts again');
    koEvent('b', c);
    assert.deepEqual(switches, ['calm'], 'positive control');
});

test('a reveal of a visible, peaceful or KO\'d NPC announces nothing', () => {
    const c = setup(['a', 'b', 'p'], { hostile: ['a', 'b'], ko: ['b'] });
    mapHide(c.m, 'a'); mapHide(c.m, 'b'); mapHide(c.m, 'p');
    c.sys.isNPCHostile = (id) => id !== 'p';
    day();    // never hidden: a plain re-show
    assert.deepEqual(announced, []);
    night(); day();
    assert.deepEqual(announced, ['a'], 'only the conscious hostile');
});

test('a hostile that starts hidden and was never touched by a mapping still counts', () => {
    const c = setup(['a', 'b']);
    c.m.npcs.get('b').isVisible = false;   // initiallyHidden, no record
    assert.equal(c.m.isHiddenByMapping('b'), false);
    koEvent('a', c);
    assert.deepEqual(switches, []);
});

test('hidden state survives a reload (export, restore, register)', () => {
    const first = setup(['a', 'b'], { ko: ['a'] });
    first.m.recordNpcVisibility('b', false);
    const saved = JSON.parse(JSON.stringify(first.m.exportNpcVisibility()));
    const after = setup(['a', 'b'], { ko: ['a'] });
    assert.equal(after.m.isHiddenByMapping('b'), false, 'fresh session has no record');
    after.m.restoreNpcVisibility(saved);
    assert.equal(after.m.isHiddenByMapping('b'), true);
    window.eventDispatcher.emit('npc_ko', { npcId: 'a' });
    assert.deepEqual(switches, ['calm']);
});

// Build a real NPCBehavior for a restored-hostile NPC (what a reload does)
function restoreBehavior(c, id) {
    const sprite = { x: 0, y: 0, displayWidth: 32, displayHeight: 32, originX: 0.5, originY: 0.5,
        body: { offset: { x: 0, y: 0 }, halfWidth: 8, halfHeight: 8 }, setTint() {} };
    window.npcHostileSystem.takeRestoredHostility = () => ({ hostile: true, ko: false });
    return new NPCBehavior(id, sprite, { hostile: {} }, {}, {});
}

test('M2: a restored hostile hidden by a mapping is not announced on reload', () => {
    const c = setup(['a', 'b']);
    c.m.restoreNpcVisibility({ b: false });
    restoreBehavior(c, 'b');
    assert.deepEqual(announced, [], 'no hostile event, so no fight music for a hidden NPC');
});

test('M2: a restored hostile that is not hidden is still announced on reload', () => {
    const c = setup(['a', 'b']);
    restoreBehavior(c, 'b');
    assert.deepEqual(announced, ['b']);
});

test('M2 then reveal: reload with the NPC hidden, later revealed, announces once on the reveal', () => {
    const c = setup(['a', 'b']); mapHide(c.m, 'b');
    c.m.restoreNpcVisibility({ b: false });
    restoreBehavior(c, 'b');
    assert.deepEqual(announced, []);
    day();
    assert.deepEqual(announced, ['b']);
});

test('a hidden hostile with no record is announced on its first reveal (reveal branch only)', () => {
    // The startHostile creation path is covered by the real NPCBehavior tests below.
    const c = setup(['a', 'r']); mapHide(c.m, 'r');
    c.m.npcs.get('r').isVisible = false;   // initiallyHidden, no record yet
    day();
    assert.deepEqual(announced, ['r']);
});

test('m1: hiding an already-hidden conscious hostile again does not re-fire all_hostiles_ko', () => {
    const c = setup(['a', 'b']); mapHide(c.m, 'b');
    koEvent('a', c);
    night();
    assert.deepEqual(switches, ['calm']);
    night();
    assert.deepEqual(switches, ['calm'], 'nothing changed, so no second switch');
    day(); night();
    assert.deepEqual(switches, ['calm', 'calm'], 'positive control: a hide after a reveal is a real hide');
});

// M1: real NPCBehavior with startHostile whose sprite starts hidden (initiallyHidden)
function makeSprite(visible) {
    const sprite = { x: 0, y: 0, visible, alpha: visible ? 1 : 0, displayWidth: 32, displayHeight: 32, originX: 0.5, originY: 0.5,
        body: { offset: { x: 0, y: 0 }, halfWidth: 8, halfHeight: 8, enable: visible },
        setTint() {}, clearTint() {},
        setVisible(v) { this.visible = v; return this; }, setAlpha(a) { this.alpha = a; return this; } };
    return sprite;
}
function startHostileBehavior(c, id, visible, restored = null) {
    window.npcHostileSystem.takeRestoredHostility = () => restored;
    const b = new NPCBehavior(id, makeSprite(visible), { hostile: { startHostile: true } }, {}, {});
    c.bm.behaviors.set(id, b);
    return b;
}
function mapReveal(c, id) {
    c.m._setupEventMappings(id, [
        { eventPattern: 'global_variable_changed:day', condition: 'value === true', cooldown: 0, setVisible: true }
    ]);
}

test('M1: a startHostile NPC that starts hidden is not hostile, announces nothing and does not count', () => {
    const c = setup(['a', 'r'], { hostile: ['a'], threat: true });
    c.m.npcs.get('r').isVisible = false;
    const b = startHostileBehavior(c, 'r', false);
    assert.equal(b.hostile, false, 'no hostility while nobody can see it');
    assert.equal(c.sys.isNPCHostile('r'), false);
    assert.deepEqual(switches, [], 'no threat cue for an NPC on nobody\'s screen');
    koEvent('a', c);
    assert.deepEqual(switches, ['calm'], 'all_hostiles_ko can fire with the hidden reinforcement');
});

test('M1: revealing it turns it hostile with exactly one threat cue, and it counts from then on', () => {
    const c = setup(['a', 'r'], { hostile: ['a'], threat: true });
    c.m.npcs.get('r').isVisible = false; mapReveal(c, 'r');
    const b = startHostileBehavior(c, 'r', false);
    day();
    assert.equal(b.sprite.visible, true);
    assert.equal(c.sys.isNPCHostile('r'), true);
    assert.deepEqual(switches, ['threat'], 'one cue, with the NPC on screen');
    assert.deepEqual(announced, [], 'no second announce for the same reveal');
    koEvent('a', c);
    assert.deepEqual(switches, ['threat'], 'r counts again');
    koEvent('r', c);
    assert.deepEqual(switches, ['threat', 'calm'], 'positive control');
});

test('M1: a visible startHostile NPC is still hostile at creation', () => {
    const c = setup(['r'], { hostile: [], threat: true });
    const b = startHostileBehavior(c, 'r', true);
    assert.equal(b.hostile, true);
    assert.deepEqual(switches, ['threat']);
});

test('M1 reload: still hidden, nothing saved, so still no cue, and the reveal gives one', () => {
    const c = setup(['a', 'r'], { hostile: ['a'], threat: true });
    c.m.npcs.get('r').isVisible = false; mapReveal(c, 'r');
    c.m.restoreNpcVisibility({});
    const b = startHostileBehavior(c, 'r', false, null);   // nothing was recorded before the reload
    assert.deepEqual(switches, []);
    assert.equal(b.hostile, false);
    day();
    assert.deepEqual(switches, ['threat']);
});

test('M1 reload after the reveal: hostility restored, visible, announced once', () => {
    const c = setup(['a', 'r'], { hostile: ['a'], threat: true });
    startHostileBehavior(c, 'r', true, { hostile: true, ko: false });
    assert.deepEqual(announced, ['r']);
});

test('M1 reload: a restored hostile on a hidden sprite with no mapping record waits for the reveal', () => {
    const c = setup(['a', 'r'], { hostile: ['a'], threat: true });
    c.m.npcs.get('r').isVisible = false; mapReveal(c, 'r');
    startHostileBehavior(c, 'r', false, { hostile: true, ko: false });
    assert.deepEqual(announced, [], 'hidden, so not announced at room load');
    day();
    assert.deepEqual(announced, ['r'], 'announced on the reveal');
});
