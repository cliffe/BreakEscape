// systems/screen-states.js: the locked-screen look of a workstation PC and its lock and unlock
// sounds, driven by the workstation events (PHYSICAL_PENTEST_ACCESS_FOLLOWUP_PLAN.md 3.1).
// Run with: bin/test-js test/js/screen-states.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

globalThis.window = {};
const { ScreenStates, installScreenStates, lockedKey, findSprite, LOCK_SOUND, UNLOCK_SOUND } =
    await import('../../public/break_escape/js/systems/screen-states.js');
const { WorkstationState } = await import('../../public/break_escape/js/systems/workstation-state.js');

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');

/** A dispatcher with the engine's matching: exact names, and `prefix*` listeners. */
function dispatcher() {
    const listeners = [];
    return {
        on(pattern, cb) { listeners.push([pattern, cb]); },
        emit(name, data) {
            for (const [p, cb] of [...listeners]) {
                if (p === name || (p.endsWith('*') && name.startsWith(p.slice(0, -1)))) cb(data);
            }
        },
        count: () => listeners.length
    };
}

function sprite(data, key, { ghost = true } = {}) {
    const s = {
        scenarioData: data,
        texture: { key },
        setCalls: [],
        setTexture(k) { this.texture = { key: k }; this.setCalls.push(k); },
        scene: { textures: { exists: (k) => window.__textures.has(k) } }
    };
    if (ghost) s.proximityGhost = { key, setTexture(k) { this.key = k; } };
    return s;
}

/**
 * A stub world: one room `office` (the player's) and one room `far`, a real WorkstationState
 * on a real-shaped dispatcher, NPC records shaped like npcManager.npcs values.
 */
function world({ objects, textures = ['pc_desktop', 'pc_desktop_locked', 'pc6'], installWs = true } = {}) {
    for (const k of Object.keys(window)) delete window[k];
    const d = dispatcher();
    const played = [];
    const globals = {};
    window.__textures = new Set(textures);
    window.eventDispatcher = d;
    window.currentPlayerRoom = 'office';
    window.soundManager = { play: (n) => played.push(n) };
    window.rooms = { office: { objects: {} }, far: { objects: {} } };
    const sprites = {};
    for (const o of objects) {
        const s = sprite(o.data, o.key, o);
        sprites[o.data.id] = s;
        window.rooms[o.room || 'office'].objects[`obj_${o.data.id}`] = s;
    }
    const npcs = [
        { id: 'ann', displayName: 'Ann', npcType: 'person', roomId: 'office', needsHome: 'pc_a', behavior: {} },
        { id: 'bob', displayName: 'Bob', npcType: 'person', roomId: 'office', needsHome: 'pc_b', behavior: {} },
        { id: 'cat', displayName: 'Cat', npcType: 'person', roomId: 'far', needsHome: 'pc_c', behavior: {} }
    ];
    const env = {
        objects: () => Object.values(window.rooms).flatMap(r => Object.values(r.objects).map(s => s.scenarioData)),
        npcs: () => npcs, globals: () => globals,
        on: (p, cb) => d.on(p, cb),
        emit: (n, data) => d.emit(n, data),
        setGlobal: (k, v) => {
            if (globals[k] === v) return;
            const old = globals[k]; globals[k] = v;
            d.emit(`global_variable_changed:${k}`, { name: k, value: v, oldValue: old });
        },
        roll: () => 0.5
    };
    const ws = new WorkstationState(env);
    if (installWs) { ws.install(); window.workstationState = ws; }
    return { d, played, globals, sprites, ws, left: (id) => d.emit(`npc_left_post:${id}`, { npcId: id }), back: (id) => d.emit(`npc_returned_post:${id}`, { npcId: id }) };
}

const pcA = (extra = {}) => ({ data: { id: 'pc_a', type: 'pc', workstation: true, ...extra }, key: 'pc_desktop' });
const pcB = (extra = {}) => ({ data: { id: 'pc_b', type: 'pc', workstation: true, locksScreenOnLeave: false, ...extra }, key: 'pc_desktop' });

test('lockedKey: <key>_locked when that texture is loaded, else null; built from the key it is given', () => {
    const has = (k) => ['pc_desktop_locked', 'pc3_locked'].includes(k);
    assert.equal(lockedKey('pc_desktop', has), 'pc_desktop_locked');
    assert.equal(lockedKey('pc3', has), 'pc3_locked');
    assert.equal(lockedKey('pc', has), null);
    assert.equal(lockedKey('pc6', has), null);
    assert.equal(lockedKey(null, has), null);
    assert.equal(lockedKey('pc_desktop', null), null);
});

test('the sounds are the two loaded files the plan names', () => {
    assert.equal(LOCK_SOUND, 'lockpick_set');
    assert.equal(UNLOCK_SOUND, 'ui_confirm');
    const sm = readFileSync(join(root, 'public/break_escape/js/systems/sound-manager.js'), 'utf8');
    assert.match(sm, /load\.audio\('lockpick_set'/);
    assert.match(sm, /load\.audio\('ui_confirm'/);
});

test('a locking owner leaves and returns: the sprite and its ghost swap both ways, one sound each way', () => {
    const w = world({ objects: [pcA()] });
    const ss = new ScreenStates().install();
    const s = w.sprites.pc_a;
    assert.deepEqual(ss.transitions, []);
    w.left('ann');
    assert.equal(s.texture.key, 'pc_desktop_locked');
    assert.equal(s.proximityGhost.key, 'pc_desktop_locked');
    assert.equal(s._screenLocked, true);
    assert.deepEqual(w.played, [LOCK_SOUND]);
    w.back('ann');
    assert.equal(s.texture.key, 'pc_desktop');
    assert.equal(s.proximityGhost.key, 'pc_desktop');
    assert.equal(s._screenLocked, false);
    assert.deepEqual(w.played, [LOCK_SOUND, UNLOCK_SOUND]);
    assert.deepEqual(ss.transitions.map(t => [t.objectId, t.locked, t.sound]),
        [['pc_a', true, LOCK_SOUND], ['pc_a', false, UNLOCK_SOUND]]);
    assert.ok(ss.transitions.every(t => typeof t.at === 'number'));
    // A second cycle works from the remembered base key
    w.left('ann'); w.back('ann');
    assert.deepEqual(s.setCalls, ['pc_desktop_locked', 'pc_desktop', 'pc_desktop_locked', 'pc_desktop']);
});

test('an owner who leaves the screen open: no transition and no sound, on the leave or the return (unset flag is the base look)', () => {
    const w = world({ objects: [pcB()] });
    const ss = new ScreenStates().install();
    w.left('bob');
    w.back('bob');
    assert.equal(w.sprites.pc_b._screenLocked, undefined);
    assert.deepEqual(w.sprites.pc_b.setCalls, []);
    assert.deepEqual(w.played, []);
    assert.deepEqual(ss.transitions, []);
});

test('sound only when audible and the PC is in the player\'s room; the look and the record follow anyway', () => {
    const w = world({ objects: [{ data: { id: 'pc_c', type: 'pc', workstation: true }, key: 'pc_desktop', room: 'far' }] });
    const ss = new ScreenStates().install();
    w.left('cat');
    assert.equal(w.sprites.pc_c.texture.key, 'pc_desktop_locked');
    assert.deepEqual(w.played, []);
    assert.deepEqual(ss.transitions.map(t => [t.locked, t.sound]), [[true, null]]);
    // The player walks in before the return: that one is heard
    window.currentPlayerRoom = 'far';
    w.back('cat');
    assert.deepEqual(w.played, [UNLOCK_SOUND]);
    // A direct silent apply in the player's room plays nothing
    w.ws.onLeft('zed');   // nobody's stations
    const w2 = world({ objects: [pcA()] });
    const ss2 = new ScreenStates();
    w2.left('ann');       // nothing listening
    assert.equal(ss2.apply('pc_a', { audible: false }).sound, null);
    assert.deepEqual(w2.played, []);
    assert.equal(w2.sprites.pc_a.texture.key, 'pc_desktop_locked');
});

test('a base with no <key>_locked texture keeps its texture and size, and still sounds and records', () => {
    const w = world({ objects: [{ data: { id: 'pc_a', type: 'pc', workstation: true }, key: 'pc6' }] });
    const ss = new ScreenStates().install();
    w.left('ann');
    w.back('ann');
    assert.deepEqual(w.sprites.pc_a.setCalls, []);
    assert.equal(w.sprites.pc_a.texture.key, 'pc6');
    assert.equal(w.sprites.pc_a.proximityGhost.key, 'pc6');
    assert.deepEqual(w.played, [LOCK_SOUND, UNLOCK_SOUND]);
    assert.deepEqual(ss.transitions.map(t => t.locked), [true, false]);
});

test('the locked key is built from the sprite\'s real texture key, not the object\'s type', () => {
    // type "pc" on a map item drawn as pc6: pc_desktop_locked is loaded but must not be used
    const w = world({ objects: [{ data: { id: 'pc_a', type: 'pc', workstation: true }, key: 'pc6' }] });
    new ScreenStates().install();
    w.left('ann');
    assert.equal(w.sprites.pc_a.texture.key, 'pc6');
});

test('skipped: an object with spriteVariants, a workstation with no owner, a non-workstation, an unknown id', () => {
    const w = world({ objects: [
        pcA({ spriteVariants: [{ condition: 'globalVars.x', value: 'pc_ransomware' }] }),
        { data: { id: 'hot_desk', type: 'pc', lockType: 'login' }, key: 'pc_desktop' },
        { data: { id: 'plant', type: 'plant' }, key: 'pc_desktop' }
    ] });
    const ss = new ScreenStates().install();
    w.left('ann');
    for (const id of ['pc_a', 'hot_desk', 'plant', 'nope', undefined]) assert.equal(ss.apply(id, { audible: true }), null);
    ss.syncRoom('office');
    assert.equal(w.sprites.pc_a.texture.key, 'pc_desktop');
    assert.deepEqual(w.played, []);
    assert.deepEqual(ss.transitions, []);
});

test('a password session hides the padlock and its end shows it again, both silent; a claimed session never hides it', () => {
    const w = world({ objects: [pcA()] });
    const ss = new ScreenStates().install();
    const sessions = new Map();
    window.pcSessions = { has: (id) => sessions.has(id), get: (id) => sessions.get(id) || null };
    w.left('ann');
    w.played.length = 0;
    sessions.set('pc_a', { pcId: 'pc_a', via: 'password' });
    w.d.emit('pc_signed_in', { pcId: 'pc_a' });
    assert.equal(w.sprites.pc_a.texture.key, 'pc_desktop');
    sessions.delete('pc_a');
    w.d.emit('pc_signed_out', { pcId: 'pc_a' });
    assert.equal(w.sprites.pc_a.texture.key, 'pc_desktop_locked');
    assert.deepEqual(w.played, []);
    assert.deepEqual(ss.transitions.slice(1).map(t => [t.locked, t.sound]), [[false, null], [true, null]]);
    // A claim (it cannot exist on a locked screen; one in flight when an auto lock fires) changes nothing
    const n = ss.transitions.length;
    sessions.set('pc_a', { pcId: 'pc_a', via: 'claim' });
    w.d.emit('pc_signed_in', { pcId: 'pc_a' });
    assert.equal(w.sprites.pc_a.texture.key, 'pc_desktop_locked');
    sessions.delete('pc_a');
    w.d.emit('pc_signed_out', { pcId: 'pc_a' });
    assert.equal(ss.transitions.length, n);
});

test('an auto lock with a claimed session held sounds at once, whatever the listener order', () => {
    const w = world({ objects: [pcB({ policy: 'corp' })] });
    window.pcSessions = { has: () => true, get: () => ({ pcId: 'pc_b', via: 'claim' }) };   // never cleared: as if pcSessions heard the event last
    const ss = new ScreenStates().install();
    w.left('bob');
    assert.deepEqual(ss.transitions, []);
    w.sprites.pc_b.scenarioData.screenLocked = true;    // what _checkAutoLock does before it emits
    w.d.emit('workstation_auto_locked:pc_b', { objectId: 'pc_b', ownerId: 'bob' });
    assert.equal(w.sprites.pc_b.texture.key, 'pc_desktop_locked');
    assert.deepEqual(w.played, [LOCK_SOUND]);
});

test('a password session held across the owner\'s leave keeps the base look, with no sound', () => {
    const w = world({ objects: [pcA()] });
    window.pcSessions = { get: () => ({ pcId: 'pc_a', via: 'password' }) };
    const ss = new ScreenStates().install();
    w.left('ann'); w.back('ann');
    assert.deepEqual(w.sprites.pc_a.setCalls, []);
    assert.deepEqual(w.played, []);
    assert.deepEqual(ss.transitions, []);
});

test('transitions keeps the last 50', () => {
    const w = world({ objects: [pcA()] });
    const ss = new ScreenStates().install();
    for (let i = 0; i < 30; i++) { w.left('ann'); w.back('ann'); }
    assert.equal(ss.transitions.length, 50);
    assert.equal(ss.transitions[49].locked, false);
    assert.equal(ss.transitions[0].locked, true);
});

// ---- boot and reload: nothing flashes or sounds ----

test('boot: syncRoom and install before the workstation state exists do nothing', () => {
    const w = world({ objects: [pcA()], installWs: false });
    const ss = new ScreenStates();
    ss.syncRoom('office');
    ss.install();
    assert.equal(ss.apply('pc_a', { audible: true }), null);
    assert.deepEqual(w.sprites.pc_a.setCalls, []);
    assert.deepEqual(w.played, []);
    assert.deepEqual(ss.transitions, []);
    // And the hook in core/rooms.js is safe before the module is installed
    assert.equal(window.screenStates?.syncRoom('office'), undefined);
});

test('boot: with every owner at their post the install pass changes nothing', () => {
    const w = world({ objects: [pcA(), pcB()] });
    const ss = new ScreenStates().install();
    assert.deepEqual(ss.transitions, []);
    assert.deepEqual(w.played, []);
    assert.deepEqual(w.sprites.pc_a.setCalls, []);
});

test('the install pass and syncRoom show an owner already away and locked, silently', () => {
    const w = world({ objects: [pcA()] });
    w.left('ann');                       // before anything listens
    const ss = new ScreenStates().install();
    assert.equal(w.sprites.pc_a.texture.key, 'pc_desktop_locked');
    assert.deepEqual(w.played, []);
    assert.deepEqual(ss.transitions.map(t => [t.locked, t.sound]), [[true, null]]);
    // A room made later (its station found after the leave): syncRoom, silent, and the late
    // roll writes the globals the dot and the texts read
    const late = sprite({ id: 'pc_c', type: 'pc', workstation: true }, 'pc_desktop');
    w.ws.onLeft('cat');
    window.rooms.far.objects.obj_pc_c = late;
    window.currentPlayerRoom = 'far';
    ss.syncRoom('far');
    assert.equal(late.texture.key, 'pc_desktop_locked');
    assert.equal(w.globals.pc_c_screen_locked, true);
    assert.deepEqual(w.played, []);
});

test('reload: saved <id>_screen_locked globals reset by the workstation install, and a global change by itself, swap nothing and play nothing', () => {
    const w = world({ objects: [pcA()], installWs: false });
    w.globals.pc_a_screen_locked = true;
    w.globals.pc_a_owner_away = true;
    const ss = new ScreenStates();
    window.workstationState = w.ws;
    // The listener order of a live boot does not matter: try screen states first
    ss.install();
    w.ws.install();                      // resetGlobals emits global_variable_changed for both
    assert.equal(w.globals.pc_a_screen_locked, false);
    w.d.emit('global_variable_changed:pc_a_screen_locked', { name: 'pc_a_screen_locked', value: true, oldValue: false });
    assert.deepEqual(w.sprites.pc_a.setCalls, []);
    assert.deepEqual(w.played, []);
    assert.deepEqual(ss.transitions, []);
});

test('reload: a restored claim ending (pc_signed_out) is silent and finds nothing locked', () => {
    const w = world({ objects: [pcB()] });
    const ss = new ScreenStates().install();
    w.d.emit('pc_signed_out', { pcId: 'pc_b', npcId: 'bob', reason: 'claim_ended' });
    assert.deepEqual(w.played, []);
    assert.deepEqual(ss.transitions, []);
});

test('install is idempotent: a second call adds no listeners, so one event makes one sound', () => {
    const w = world({ objects: [pcA()] });
    const first = installScreenStates();
    const n = w.d.count();
    assert.equal(installScreenStates(), first);
    first.install();
    assert.equal(w.d.count(), n);
    w.left('ann');
    assert.deepEqual(w.played, [LOCK_SOUND]);
    assert.equal(findSprite('pc_a').roomId, 'office');
});

// ---- wiring and art (what a node test can see of core/game.js, core/rooms.js and the assets) ----

test('wiring: game.js preloads pc_desktop and pc_desktop_locked and installs after the workstation state; rooms.js syncs a room once made', () => {
    const game = readFileSync(join(root, 'public/break_escape/js/core/game.js'), 'utf8');
    assert.match(game, /load\.image\('pc_desktop', 'objects\/pc_desktop\.png'\)/);
    assert.match(game, /load\.image\('pc_desktop_locked', 'objects\/pc_desktop_locked\.png'\)/);
    const ws = game.indexOf('ws.installWorkstationState()');
    const ss = game.indexOf('m.installScreenStates()');
    assert.ok(ws > 0 && ss > ws, 'screen states install after the workstation state');
    const rooms = readFileSync(join(root, 'public/break_escape/js/core/rooms.js'), 'utf8');
    const made = rooms.indexOf('createRoom(roomId, roomData, position);');
    const sync = rooms.indexOf('window.screenStates?.syncRoom(roomId);');
    assert.ok(made > 0 && sync > made && sync - made < 300, 'syncRoom straight after createRoom in loadRoomOnce');
    assert.equal(rooms.split('window.screenStates?.syncRoom(').length, 2, 'called in one place');
});

test('art: pc_desktop_locked.png is the same size as pc_desktop.png, which is pc.png (a swap never changes the display size)', () => {
    const dir = join(root, 'public/break_escape/assets/objects');
    const size = (name) => { const b = readFileSync(join(dir, name)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
    assert.deepEqual(size('pc_desktop.png'), [36, 24]);
    assert.deepEqual(size('pc_desktop_locked.png'), size('pc_desktop.png'));
    assert.ok(readFileSync(join(dir, 'pc_desktop.png')).equals(readFileSync(join(dir, 'pc.png'))));
});
