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
// The engine's own dispatcher, so a change to its matching fails these tests
const { default: NPCEventDispatcher } = await import('../../public/break_escape/js/systems/npc-events.js');

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');

/** The live NPCEventDispatcher, with a count of its listeners. */
function dispatcher() {
    const d = new NPCEventDispatcher();
    d.count = () => [...d.listeners.values()].reduce((n, arr) => n + arr.length, 0);
    return d;
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
function world({ objects, textures = ['pc_desktop', 'pc_desktop_locked', 'pc6'], installWs = true, envExtra = null } = {}) {
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
        roll: () => 0.5,
        ...(envExtra || {})
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

test('an auto lock with a claimed session held sounds at once, whatever the listener order (the real tick path)', () => {
    // The workstation state's own policy, clock and tick: its _checkAutoLock sets the state and emits
    let clock = 0;
    const ticks = [];
    const w = world({ objects: [pcB({ policy: 'corp' })], envExtra: {
        policyFor: (d) => (d.policy === 'corp' ? { autoLockMin: 5 } : null),
        clockMs: () => clock,
        onTick: (fn) => ticks.push(fn)
    } });
    const tick = (ms) => { clock += ms; ticks.forEach(fn => fn()); };
    window.pcSessions = { has: () => true, get: () => ({ pcId: 'pc_b', via: 'claim' }) };   // never cleared: as if pcSessions heard the event last
    const ss = new ScreenStates().install();
    w.left('bob');
    tick(5 * 60000 - 1);
    assert.deepEqual(ss.transitions, []);
    assert.equal(w.sprites.pc_b.texture.key, 'pc_desktop');
    tick(1);
    assert.equal(w.sprites.pc_b.scenarioData.screenLocked, true);
    assert.equal(w.sprites.pc_b.texture.key, 'pc_desktop_locked');
    assert.deepEqual(w.played, [LOCK_SOUND]);
    assert.deepEqual(ss.transitions.map(t => [t.objectId, t.locked, t.sound]), [['pc_b', true, LOCK_SOUND]]);
    tick(60000);
    assert.deepEqual(w.played, [LOCK_SOUND], 'once');
});

// Code review R1 m2: the knock-out roll shows the look, but nobody pressed lock.
test('an owner knocked out at the desk: the padlock shows with no lock sound; the return still sounds', () => {
    const w = world({ objects: [pcA()], envExtra: { ownerTracked: () => true } });
    const ss = new ScreenStates().install();
    w.d.emit('npc_ko:ann', { npcId: 'ann' });
    assert.equal(w.sprites.pc_a.texture.key, 'pc_desktop_locked');
    assert.deepEqual(ss.transitions.map(t => [t.locked, t.sound]), [[true, null]]);
    assert.deepEqual(w.played, []);
    w.back('ann');
    assert.deepEqual(w.played, [UNLOCK_SOUND]);
});

// Code review R1 m4: currentPlayerRoom is '' while the player's feet are in no room's floor.
test('in a doorway or gap the last room the player stood in still hears the sound; another room does not', () => {
    const w = world({ objects: [pcA(), { data: { id: 'pc_c', type: 'pc', workstation: true }, key: 'pc_desktop', room: 'far' }] });
    new ScreenStates().install();
    window.currentPlayerRoom = '';
    window.lastPlayerRoom = 'office';
    w.left('ann');
    assert.deepEqual(w.played, [LOCK_SOUND]);
    w.left('cat');
    assert.deepEqual(w.played, [LOCK_SOUND], 'pc_c is in the far room');
    // no room known at all (before the first room check): silent
    window.lastPlayerRoom = '';
    w.back('ann');
    assert.deepEqual(w.played, [LOCK_SOUND]);
    // a current room wins over the last one
    window.currentPlayerRoom = 'far';
    window.lastPlayerRoom = 'office';
    w.left('ann');
    assert.deepEqual(w.played, [LOCK_SOUND]);
    w.back('cat');
    assert.deepEqual(w.played, [LOCK_SOUND, UNLOCK_SOUND]);
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
    // rooms.js keeps the last room the player stood in beside currentPlayerRoom, and clears it with it
    assert.match(rooms, /window\.currentPlayerRoom = detectedRoom;\s*(\/\/[^\n]*\s*)?if \(detectedRoom\) window\.lastPlayerRoom = detectedRoom;/);
    assert.match(rooms, /window\.currentPlayerRoom = '';\s*window\.lastPlayerRoom = '';/);
    // a failed import of screen-states.js is reported as itself, and the boot goes on
    assert.match(game, /m\.installScreenStates\(\); return state; \}\)\s*\.catch\(e => \{ console\.warn\('screen states failed', e\); return state; \}\)/);
});

test('art: pc_desktop_locked.png is the same size as pc_desktop.png, which is pc.png (a swap never changes the display size)', () => {
    const dir = join(root, 'public/break_escape/assets/objects');
    const size = (name) => { const b = readFileSync(join(dir, name)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
    assert.deepEqual(size('pc_desktop.png'), [36, 24]);
    assert.deepEqual(size('pc_desktop_locked.png'), size('pc_desktop.png'));
    assert.ok(readFileSync(join(dir, 'pc_desktop.png')).equals(readFileSync(join(dir, 'pc.png'))));
});

/** RGBA pixels of an 8-bit RGBA non-interlaced PNG (every PC sprite is one), via node's zlib. */
async function rgba(path) {
    const { inflateSync } = await import('node:zlib');
    const b = readFileSync(path);
    const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
    assert.ok(b[24] === 8 && b[25] === 6 && b[28] === 0, `${path} is 8-bit RGBA, not interlaced`);
    const idat = [];
    for (let o = 8; o < b.length;) {
        const len = b.readUInt32BE(o), type = b.toString('ascii', o + 4, o + 8);
        if (type === 'IDAT') idat.push(b.subarray(o + 8, o + 8 + len));
        o += 12 + len;
    }
    const raw = inflateSync(Buffer.concat(idat));
    const stride = w * 4, out = Buffer.alloc(stride * h);
    for (let y = 0; y < h; y++) {
        const f = raw[y * (stride + 1)];
        for (let x = 0; x < stride; x++) {
            const v = raw[y * (stride + 1) + 1 + x];
            const a = x >= 4 ? out[y * stride + x - 4] : 0;
            const up = y > 0 ? out[(y - 1) * stride + x] : 0;
            const c = x >= 4 && y > 0 ? out[(y - 1) * stride + x - 4] : 0;
            const pa = Math.abs(up - c), pb = Math.abs(a - c), pc = Math.abs(a + up - 2 * c);
            const pred = [0, a, up, (a + up) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? up : c][f];
            out[y * stride + x] = (v + pred) & 255;
        }
    }
    return out;
}

test('art: every workstation PC base has a locked picture, preloaded as <key>_locked, the size of the base, changed only inside the screen', async () => {
    const game = readFileSync(join(root, 'public/break_escape/js/core/game.js'), 'utf8');
    const dir = join(root, 'public/break_escape/assets/objects');
    const loaded = new Map([...game.matchAll(/load\.image\('([^']+)', 'objects\/([^']+)'\)/g)].map(m => [m[1], m[2]]));
    const size = (name) => { const b = readFileSync(join(dir, name)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
    const keys = ['pc', 'pc1', 'pc3', 'pc4', 'pc5', 'pc6', 'pc7', 'pc8', 'pc9', 'pc10', 'pc11', 'pc12', 'pc_desktop'];
    for (const key of keys) {
        const base = loaded.get(key);
        const locked = loaded.get(`${key}_locked`);
        assert.ok(base, `${key} is preloaded`);
        assert.ok(locked, `${key}_locked is preloaded`);
        assert.deepEqual(size(locked), size(base), `${key}_locked is the size of ${base}`);
        assert.ok(!readFileSync(join(dir, locked)).equals(readFileSync(join(dir, base))), `${locked} differs from ${base}`);
        // the body keeps its outline (no pixel turns transparent or opaque) and the screen is repainted
        const a = await rgba(join(dir, base));
        const b = await rgba(join(dir, locked));
        let changed = 0;
        for (let i = 0; i < a.length; i += 4) {
            if (a[i + 3] !== b[i + 3]) assert.fail(`${locked} changes the outline at pixel ${i / 4}`);
            if (a.readUInt32BE(i) !== b.readUInt32BE(i)) changed++;
        }
        assert.ok(changed > 40, `${locked} repaints the screen (${changed} px)`);
    }
    // the key `pc` is pc1.png, so it shares pc1's locked picture
    assert.equal(loaded.get('pc'), 'pc1.png');
    assert.equal(loaded.get('pc_locked'), 'pc1_locked.png');
});
