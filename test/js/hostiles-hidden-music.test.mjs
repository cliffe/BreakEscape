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
const calmed = [];
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
        announceRestoredHostile: (id) => { announced.push(id); return true; },
        recordCalm: (id) => { calmed.push(id); }
    };
    window.npcHostileSystem = sys;
    announced.length = 0;
    calmed.length = 0;
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
function restoreBehavior(c, id, visible = true) {
    const sprite = { x: 0, y: 0, visible, displayWidth: 32, displayHeight: 32, originX: 0.5, originY: 0.5,
        body: { offset: { x: 0, y: 0 }, halfWidth: 8, halfHeight: 8 }, setTint() {} };
    window.npcHostileSystem.takeRestoredHostility = () => ({ hostile: true, ko: false });
    return new NPCBehavior(id, sprite, { hostile: {} }, {}, {});
}

test('M2: a restored hostile hidden by a mapping is not announced on reload', () => {
    const c = setup(['a', 'b']);
    c.m.restoreNpcVisibility({ b: false });
    restoreBehavior(c, 'b', false);   // npc-sprites.js hides the sprite for a hidden record
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
    restoreBehavior(c, 'b', false);
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
    const c = setup(['a', 'r'], { hostile: ['a', 'r'], threat: true });
    c.m.npcs.get('r').isVisible = false; mapReveal(c, 'r');
    startHostileBehavior(c, 'r', false, { hostile: true, ko: false });
    assert.deepEqual(announced, [], 'hidden, so not announced at room load');
    day();
    assert.deepEqual(announced, ['r'], 'announced on the reveal');
});

// R3 minors
test('R3 m1: a calm set on a pending NPC is recorded so a reload keeps it calm', () => {
    const c = setup(['a', 'r'], { hostile: ['a'], threat: true });
    c.m.npcs.get('r').isVisible = false; mapReveal(c, 'r');
    const b = startHostileBehavior(c, 'r', false);
    b.setHostile(false);
    assert.deepEqual(calmed, ['r'], 'the calm is saved');
    day();
    assert.equal(c.sys.isNPCHostile('r'), false, 'still calm after the reveal');
    assert.deepEqual(switches, []);
});

test('R3 m1: setHostile(false) on an NPC with no pending start records nothing', () => {
    const c = setup(['r'], { hostile: [], threat: true });
    const b = startHostileBehavior(c, 'r', true);   // visible startHostile: hostile at creation
    calmed.length = 0;
    b.hostile = false;
    b.setHostile(false);
    assert.deepEqual(calmed, []);
});

test('R3 m2: a reveal does not turn a KO\'d pending NPC hostile', () => {
    const c = setup(['a', 'r'], { hostile: ['a'], ko: ['r'], threat: true });
    c.m.npcs.get('r').isVisible = false; mapReveal(c, 'r');
    const b = startHostileBehavior(c, 'r', false);
    day();
    assert.equal(b.hostile, false);
    assert.equal(b._startHostileOnReveal, false, 'flag cleared either way');
    assert.equal(c.sys.isNPCHostile('r'), false);
    assert.deepEqual(switches, []);
});

test('R3 m3: a restored hostile on a hidden sprite with no record is recorded hidden, so it does not count', () => {
    const c = setup(['a', 'r'], { hostile: ['a', 'r'], threat: true });
    c.m.npcs.get('r').isVisible = false; mapReveal(c, 'r');
    startHostileBehavior(c, 'r', false, { hostile: true, ko: false });
    assert.equal(c.m.isHiddenByMapping('r'), true, 'counted and announced agree');
    koEvent('a', c);
    assert.deepEqual(switches, ['calm'], 'the unseen hostile does not hold the fight');
    day();
    assert.deepEqual(announced, ['r'], 'announced on the reveal');
});

test('R3 m3: a restored hostile on a visible sprite is not recorded hidden', () => {
    const c = setup(['r'], { hostile: ['r'] });
    startHostileBehavior(c, 'r', true, { hostile: true, ko: false });
    assert.equal(c.m.isHiddenByMapping('r'), false);
});

test('R3 m7: a second reveal of a revealed startHostile NPC gives no second cue', () => {
    const c = setup(['a', 'r'], { hostile: ['a'], threat: true });
    c.m.npcs.get('r').isVisible = false; mapReveal(c, 'r');
    startHostileBehavior(c, 'r', false);
    day();
    assert.deepEqual(switches, ['threat']);
    day();
    assert.deepEqual(switches, ['threat'], 'no second cue');
    assert.deepEqual(announced, []);
});

test('R3 m7: ink makes a hidden pending NPC hostile, then the reveal gives one cue', () => {
    const c = setup(['a', 'r'], { hostile: ['a'], threat: true });
    c.m.npcs.get('r').isVisible = false; mapReveal(c, 'r');
    const b = startHostileBehavior(c, 'r', false);
    c.sys.setNPCHostile('r', true);   // ink #hostile:r goes straight to the hostile system
    assert.equal(b._startHostileOnReveal, true, 'ink leaves the behaviour flag set');
    const before = switches.length;
    day();
    assert.deepEqual(announced, ['r'], 'the reveal announces the already-hostile NPC');
    assert.equal(switches.length - before, 0, 'no second npc_hostile_state_changed from setHostile');
    assert.equal(b.hostile, true);
});

// R4 minors. A real npc-hostile.js instance (not the stub above), loaded through data URLs as
// npc-hostility-persistence.test.mjs does. `tag` makes each import a separate module instance,
// which stands in for a page reload.
import { readFileSync } from 'node:fs';
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
async function realHostileSystem(tag) {
    const configUrl = dataUrl(readFileSync(join(js, 'config/combat-config.js'), 'utf8'));
    const eventsUrl = dataUrl(readFileSync(join(js, 'events/combat-events.js'), 'utf8'));
    const src = readFileSync(join(js, 'systems/npc-hostile.js'), 'utf8')
        .split("'../config/combat-config.js'").join(`'${configUrl}'`)
        .split("'../events/combat-events.js'").join(`'${eventsUrl}'`)
        .split("'./npc-sprites.js'").join(`'${dataUrl('export const getNPCDirection = () => "down";')}'`)
        .split("'./interaction-walls.js'").join(`'${dataUrl(readFileSync(join(js, 'systems/interaction-walls.js'), 'utf8'))}'`);
    const mod = await import(dataUrl(`${src}\n// instance ${tag}`));
    return mod.initNPCHostileSystem();
}

test('R4 m1: a calm set while hidden survives a reload (real recordCalm, export, restore, constructor)', async () => {
    // Session 1: a hidden startHostile NPC, calmed while it is still pending
    const c = setup(['a', 'r'], { hostile: ['a'], threat: true });
    c.m.npcs.get('r').isVisible = false; mapReveal(c, 'r');
    const sys1 = await realHostileSystem('m1-session1');
    window.npcHostileSystem = sys1;
    const b1 = new NPCBehavior('r', makeSprite(false), { hostile: { startHostile: true } }, {}, {});
    c.bm.behaviors.set('r', b1);
    assert.equal(b1._startHostileOnReveal, true, 'pending');
    b1.setHostile(false);
    const saved = JSON.parse(JSON.stringify(sys1.exportHostility()));
    assert.deepEqual(saved.r, { hostile: false, ko: false }, 'the calm was saved by the real recordCalm');

    // Session 2 (reload): fresh hostile system, restore, then the behaviour is made again
    const c2 = setup(['a', 'r'], { hostile: ['a'], threat: true });
    c2.m.npcs.get('r').isVisible = false; mapReveal(c2, 'r');
    const sys2 = await realHostileSystem('m1-session2');
    sys2.restoreHostility(saved);
    window.npcHostileSystem = sys2;
    const b2 = new NPCBehavior('r', makeSprite(false), { hostile: { startHostile: true } }, {}, {});
    c2.bm.behaviors.set('r', b2);
    assert.ok(!b2._startHostileOnReveal, 'the restored calm wins over startHostile');
    assert.equal(b2.hostile, false);
    day();
    assert.equal(sys2.isNPCHostile('r'), false, 'still calm after the reveal');
    assert.deepEqual(switches, [], 'no fight music');
});

test('R4 m3: ink #hostile:false through the game bridge on a pending NPC is saved and survives the reveal and a reload', async () => {
    const { NPCGameBridge } = await imp('systems/npc-game-bridge.js');
    const c = setup(['a', 'r'], { hostile: ['a'], threat: true });
    c.m.npcs.get('r').isVisible = false; mapReveal(c, 'r');
    const sys = await realHostileSystem('m3-bridge');
    window.npcHostileSystem = sys;
    const b = new NPCBehavior('r', makeSprite(false), { hostile: { startHostile: true } }, {}, {});
    c.bm.behaviors.set('r', b);
    const bridge = Object.create(NPCGameBridge.prototype);
    bridge._logAction = () => {};
    assert.equal(bridge.setNPCHostile('r', false).success, true);
    assert.equal(b._startHostileOnReveal, false, 'the pending start is cancelled');
    assert.deepEqual(sys.exportHostility().r, { hostile: false, ko: false }, 'saved for a reload');
    day();
    assert.equal(sys.isNPCHostile('r'), false);
    assert.deepEqual(switches, []);
});

test('R4 m3: setNPCHostile(false) called directly on the hostile system also cancels and saves a pending start', async () => {
    const c = setup(['a', 'r'], { hostile: ['a'], threat: true });
    c.m.npcs.get('r').isVisible = false; mapReveal(c, 'r');
    const sys = await realHostileSystem('m3-direct');
    window.npcHostileSystem = sys;
    const b = new NPCBehavior('r', makeSprite(false), { hostile: { startHostile: true } }, {}, {});
    c.bm.behaviors.set('r', b);
    sys.setNPCHostile('r', false);
    assert.equal(b._startHostileOnReveal, false);
    assert.deepEqual(sys.exportHostility().r, { hostile: false, ko: false });
    day();
    assert.equal(sys.isNPCHostile('r'), false);
    assert.equal(b.hostile, false);
    assert.deepEqual(switches, []);
});

test('R4 m3: setNPCHostile(false) on an NPC with no pending start records nothing new', async () => {
    const c = setup(['r'], { hostile: [], threat: true });
    const sys = await realHostileSystem('m3-none');
    window.npcHostileSystem = sys;
    const b = new NPCBehavior('r', makeSprite(true), { hostile: {} }, {}, {});
    c.bm.behaviors.set('r', b);
    sys.setNPCHostile('r', false);
    assert.equal(sys.exportHostility().r, undefined);
});

// R5 m2: calm, then re-hostile by ink, then reveal, on an NPC that is pending its reveal.
test('R5 m2: calm, then ink re-hostile, then reveal leaves it hostile; the ink turn cues once and the reveal repeats the same cue', async () => {
    const c = setup(['a', 'r'], { hostile: ['a'], threat: true });
    c.m.npcs.get('r').isVisible = false; mapReveal(c, 'r');
    const sys = await realHostileSystem('r5m2-direct');
    window.npcHostileSystem = sys;
    const b = new NPCBehavior('r', makeSprite(false), { hostile: { startHostile: true } }, {}, {});
    c.bm.behaviors.set('r', b);
    const before = switches.length;
    sys.setNPCHostile('r', false);
    assert.deepEqual(sys.exportHostility().r, { hostile: false, ko: false }, 'calm recorded');
    sys.setNPCHostile('r', true);
    assert.deepEqual(sys.exportHostility().r, { hostile: true, ko: false }, 'the re-hostile overwrites the calm');
    assert.equal(switches.length - before, 1, 'the ink turn cues once');
    day();
    assert.equal(sys.isNPCHostile('r'), true, 'hostile after the reveal');
    assert.ok(!b._startHostileOnReveal, 'the calm cleared the pending start, so the reveal does not re-hostile it');
    // setNPCVisible announces any hostile that was hidden, so the reveal repeats the cue. Both
    // are the same playlist, so the second switch is a no-op in play.
    assert.deepEqual(switches.slice(before), ['threat', 'threat']);
});

test('R5 m2 reload: calm, reload, then ink re-hostile, then reveal is hostile (cue repeated once)', async () => {
    const c = setup(['a', 'r'], { hostile: ['a'], threat: true });
    c.m.npcs.get('r').isVisible = false; mapReveal(c, 'r');
    const sys1 = await realHostileSystem('r5m2-reload1');
    window.npcHostileSystem = sys1;
    const b1 = new NPCBehavior('r', makeSprite(false), { hostile: { startHostile: true } }, {}, {});
    c.bm.behaviors.set('r', b1);
    sys1.setNPCHostile('r', false);
    const saved = JSON.parse(JSON.stringify(sys1.exportHostility()));
    assert.deepEqual(saved.r, { hostile: false, ko: false });

    // Reload: fresh system and behaviour, calm restored, still pending its reveal
    const c2 = setup(['a', 'r'], { hostile: ['a'], threat: true });
    c2.m.npcs.get('r').isVisible = false; mapReveal(c2, 'r');
    const sys2 = await realHostileSystem('r5m2-reload2');
    sys2.restoreHostility(saved);
    window.npcHostileSystem = sys2;
    const b2 = new NPCBehavior('r', makeSprite(false), { hostile: { startHostile: true } }, {}, {});
    c2.bm.behaviors.set('r', b2);
    assert.ok(!b2._startHostileOnReveal, 'the restored calm wins');
    const before = switches.length;
    sys2.setNPCHostile('r', true);
    const afterInk = switches.length;
    day();
    assert.equal(sys2.isNPCHostile('r'), true);
    assert.equal(sys2.exportHostility().r.hostile, true);
    // After a reload the constructor recorded the sprite hidden, so the reveal announces the
    // hostile NPC even though the ink turn already cued: two cues, both the same playlist, so
    // the second switch is a no-op in play. Pinned so a change to this is deliberate.
    assert.equal(afterInk - before, 1, 'the ink turn cues once');
    assert.deepEqual(switches.slice(before), ['threat', 'threat'], 'the reveal repeats the same cue');
});
