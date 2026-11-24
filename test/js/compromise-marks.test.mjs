// Ops core step 12 (OPS_CORE_PLAN.md 5.4, "The compromised marker in the world"): a PC, device
// or planted jack the player holds by compromise carries a light red tint and a bolt; each end
// of the hold clears it; nothing else is marked. Real pc-sessions.js and network-links.js, fake
// sprites standing in for Phaser's.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'compromise-marks-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
for (const rel of ['systems/compromise-marks.js', 'utils/compromise-bolt.js', 'systems/pc-sessions.js', 'systems/mfa-client.js', 'systems/helpdesk-client.js', 'utils/sync-before-fetch.js',
    'systems/network-links.js', 'utils/conditional-text.js', 'systems/global-writer.js', 'utils/remote-host-text.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
window.HTMLCanvasElement.prototype.getContext = () => ({ fillRect() {}, fillStyle: '' });
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { CompromiseMarks, installCompromiseMarks, MARK_TINT } = await imp('systems/compromise-marks.js');
const { PcSessions } = await imp('systems/pc-sessions.js');
const { NetworkLinks } = await imp('systems/network-links.js');

function dispatcher() {
    const on = {};
    return { on: (n, cb) => { (on[n] ||= []).push(cb); }, emit: (n, d) => { for (const cb of on[n] || []) cb(d); } };
}

let sessions, links, marks, bus, images, canvases, timers;
function sprite(id, extra = {}) {
    const calls = [];
    const s = {
        active: true, x: 100, y: 200, displayWidth: 40, displayHeight: 30, originX: 0.5, originY: 0.5, depth: 7,
        scenarioData: { id, ...(extra.data || {}) }, isHighlighted: false, tintTopLeft: 0xffffff, calls,
        // Phaser: a sprite is tinted whenever its tint is not white (a highlight is a real tint)
        get isTinted() { return this.tintTopLeft !== 0xffffff; },
        setTint(c) { calls.push(['setTint', c]); this.tintTopLeft = c; },
        clearTint() { calls.push(['clearTint']); this.tintTopLeft = 0xffffff; },
        scene: {
            add: { image: (x, y, key) => { const im = { x, y, key, destroyed: false, setOrigin() { return this; }, setDepth(d) { this.depth = d; return this; }, destroy() { this.destroyed = true; } }; images.push(im); return im; } },
            textures: { exists: (k) => canvases.has(k), addCanvas: (k, c) => canvases.set(k, c) }
        }
    };
    return s;
}
function setup(spriteList) {
    images = []; canvases = new Map();
    bus = dispatcher();
    window.eventDispatcher = bus;
    window.ApiClient = { logout: async () => ({ success: true }) };
    sessions = new PcSessions();
    links = new NetworkLinks();
    window.pcSessions = sessions;
    window.networkLinks = links;
    window.rooms = { lab: { objects: Object.fromEntries(spriteList.map(s => [s.scenarioData.id, s])) } };
    marks = new CompromiseMarks().install();
    window.compromiseMarks = marks;
    return marks;
}
const FH = (id, via, sourceId) => ({ id, via, sourceId, name: id, itemId: `item_${id}`, network: { id: 'n', name: 'N' } });
const TECH = { npcId: 'adm', username: 'adm', displayName: 'Admin', via: 'technique', remote: true, footholdId: 'fh1', host: 'PC' };
const ids = () => marks.list().map(m => m.objectId).sort();

test('a technique session marks its PC: tint property, setTint, one bolt at the top right, depth one above', () => {
    const pc = sprite('pc1');
    setup([pc]);
    links.footholds.set('fh1', FH('fh1', 'jack', 'jack1'));
    sessions._replace('pc1', { ...TECH });
    assert.deepEqual(ids(), ['pc1']);
    assert.equal(pc.compromiseTint, MARK_TINT);
    assert.deepEqual(pc.calls.at(-1), ['setTint', MARK_TINT]);
    assert.equal(images.length, 1);
    assert.equal(images[0].key, 'compromise_bolt');
    assert.deepEqual([images[0].x, images[0].y, images[0].depth], [120, 185, 8]);
    const entry = marks.list()[0];
    assert.deepEqual(entry.sources, [{ kind: 'technique', footholdId: 'fh1' }]);
    assert.equal(entry.tint, MARK_TINT, 'the live tintTopLeft');
});

test('each end clears it: the player\'s Sign out, a newer sign-in that replaces it, an unplug', async () => {
    const pc = sprite('pc1');
    setup([pc]);
    links.footholds.set('fh1', FH('fh1', 'jack', 'jack1'));
    sessions._replace('pc1', { ...TECH });
    await sessions.signOut('pc1');
    assert.deepEqual(ids(), []);
    assert.equal('compromiseTint' in pc, false);
    assert.deepEqual(pc.calls.at(-1), ['clearTint']);
    assert.equal(images[0].destroyed, true);
    sessions._replace('pc1', { ...TECH });
    assert.deepEqual(ids(), ['pc1']);
    sessions._replace('pc1', { npcId: 'a', username: 'a', displayName: 'A', via: 'password' });
    assert.deepEqual(ids(), [], 'a newer password sign-in replaces the technique session');
    // an unplug ends the foothold: the copy stays until the server's ended list arrives, but remoteViewFoothold is null
    sessions._replace('pc1', { ...TECH });
    links.footholds.delete('fh1');
    bus.emit('network_device_unplugged', { footholdId: 'fh1', endedPcIds: [] });
    assert.deepEqual(ids(), []);
});

test('an implanted PC and a planted jack are marked by their foothold and cleared by unplug', () => {
    const pc = sprite('pc2'); const jack = sprite('jack1');
    setup([pc, jack]);
    links.footholds.set('fi', FH('fi', 'implant', 'pc2'));
    links.footholds.set('fj', FH('fj', 'jack', 'jack1'));
    bus.emit('network_foothold_gained', { footholdId: 'fi' });
    assert.deepEqual(ids(), ['jack1', 'pc2']);
    assert.deepEqual(marks.list().find(m => m.objectId === 'pc2').sources, [{ kind: 'implant', footholdId: 'fi' }]);
    assert.deepEqual(marks.list().find(m => m.objectId === 'jack1').sources, [{ kind: 'jack', footholdId: 'fj' }]);
    links.footholds.delete('fj');
    bus.emit('network_device_unplugged', { footholdId: 'fj', endedPcIds: [] });
    assert.deepEqual(ids(), ['pc2']);
});

test('network_foothold_dropped (404 and a view that leaves it out) clears jack, implant and technique marks', async () => {
    const pc = sprite('pc2'); const jack = sprite('jack1'); const tpc = sprite('pc1');
    setup([pc, jack, tpc]);
    links.footholds.set('fi', FH('fi', 'implant', 'pc2'));
    links.footholds.set('fj', FH('fj', 'jack', 'jack1'));
    links.footholds.set('fh1', FH('fh1', 'jack', 'other'));
    sessions._replace('pc1', { ...TECH });
    bus.emit('network_foothold_gained', {});
    assert.deepEqual(ids(), ['jack1', 'pc1', 'pc2']);
    const dropped = [];
    bus.on('network_foothold_dropped', d => dropped.push(d));
    window.ApiClient.network = async () => { const e = new Error('gone'); e.status = 404; throw e; };
    links.api = undefined;
    links._dropFoothold('fi');
    assert.deepEqual(dropped, [{ footholdId: 'fi', sourceId: 'pc2' }]);
    assert.deepEqual(ids(), ['jack1', 'pc1']);
    links._dropFoothold('fj');
    assert.deepEqual(ids(), ['pc1']);
    links._dropFoothold('fh1');
    assert.deepEqual(ids(), [], 'the technique session\'s mark goes with the foothold it ran through');
    // the copy is still in pcSessions, remoteViewFoothold is null, and a room re-entered stays unmarked
    assert.equal(sessions.has('pc1'), true);
    assert.equal(sessions.remoteViewFoothold('pc1'), null);
    marks.syncRoom('lab');
    assert.deepEqual(ids(), []);
    assert.equal(tpc.compromiseTint, undefined);
});

test('an NPC sitting down at the PC leaves the mark on', async () => {
    const pc = sprite('pc1');
    setup([pc]);
    links.footholds.set('fh1', FH('fh1', 'jack', 'jack1'));
    sessions._replace('pc1', { ...TECH });
    assert.equal(await sessions.displaced('pc1', 'Ian'), false);
    bus.emit('npc_sat_at', { objectId: 'pc1', npcId: 'ian' });
    bus.emit('npc_borrowed_session:pc1', { objectId: 'pc1' });
    assert.deepEqual(ids(), ['pc1']);
});

test('password, credential, claim and relay sessions, a joined Wi-Fi access point and a share are never marked', () => {
    const list = ['pc_pw', 'pc_cred', 'pc_claim', 'pc_relay', 'ap1', 'share1'].map(id => sprite(id));
    setup(list);
    links.footholds.set('fw', FH('fw', 'wifi', 'ap1'));
    links.footholds.set('fp', FH('fp', 'jack', 'elsewhere'));
    sessions._replace('pc_pw', { npcId: 'a', username: 'a', displayName: 'A', via: 'password', remote: true, footholdId: 'fp', host: 'H' });
    sessions._replace('pc_cred', { npcId: 'a', username: 'a', displayName: 'A', via: 'credential', remote: true, footholdId: 'fp', host: 'H' });
    sessions._replace('pc_claim', { npcId: 'a', username: 'a', displayName: 'A', via: 'claim' });
    sessions._replace('pc_relay', { npcId: 'a', username: 'a', displayName: 'A', via: 'credential', relay: true, host: 'H' });
    bus.emit('network_foothold_gained', { footholdId: 'fw' });
    assert.deepEqual(ids(), []);
    assert.equal(images.length, 0);
    for (const s of list) assert.equal(s.compromiseTint, undefined);
});

test('an authored tint or spriteVariants keeps its look and gets only the bolt', () => {
    const tinted = sprite('pc_a', { data: { tint: 0x00ff00 } });
    const variant = sprite('pc_b', { data: { spriteVariants: [{ sprite: 'x' }] } });
    const plain = sprite('pc_c');
    setup([tinted, variant, plain]);
    links.footholds.set('fh1', FH('fh1', 'jack', 'jackx'));
    for (const id of ['pc_a', 'pc_b', 'pc_c']) sessions._replace(id, { ...TECH });
    assert.deepEqual(ids(), ['pc_a', 'pc_b', 'pc_c']);
    for (const s of [tinted, variant]) {
        assert.equal(s.compromiseTint, undefined);
        assert.deepEqual(s.calls, []);
        assert.equal(marks.list().find(m => m.objectId === s.scenarioData.id).tint, null);
    }
    assert.equal(images.length, 3, 'a bolt for each');
    assert.equal(plain.compromiseTint, MARK_TINT);
});

test('while the sprite is highlighted the property changes at once but setTint and clearTint are not called', async () => {
    const pc = sprite('pc1');
    setup([pc]);
    links.footholds.set('fh1', FH('fh1', 'jack', 'jack1'));
    pc.isHighlighted = true;
    sessions._replace('pc1', { ...TECH });
    assert.equal(pc.compromiseTint, MARK_TINT);
    assert.deepEqual(pc.calls, []);
    await sessions.signOut('pc1');
    assert.equal('compromiseTint' in pc, false);
    assert.deepEqual(pc.calls, []);
});

// S3 client R1 M1: the proximity highlight's blue is a real tint (isTinted), not an authored look
test('M1: a mark that arrives while the sprite is highlighted still sets the property, and the red shows after restTint', () => {
    const pc = sprite('pc1');
    setup([pc]);
    links.footholds.set('fh1', FH('fh1', 'jack', 'jack1'));
    pc.isHighlighted = true;
    pc.tintTopLeft = 0x4da6ff;
    assert.equal(pc.isTinted, true);
    sessions._replace('pc1', { ...TECH });
    assert.equal(pc.compromiseTint, MARK_TINT, 'the highlight is not an authored tint');
    assert.deepEqual(pc.calls, []);
    // interactions.js restTint, at the end of the hover
    pc.isHighlighted = false;
    pc.setTint(pc.compromiseTint);
    assert.equal(marks.list()[0].tint, MARK_TINT);
    // a genuinely authored tint (not highlighted) still keeps its look
    const other = sprite('pc2');
    other.tintTopLeft = 0x00ff00;
    assert.equal(other.isTinted, true);
});

test('syncRoom marks the sprites of a room made after the event; list() reads the live tint; no timer is set', () => {
    const timersSeen = [];
    const st = globalThis.setTimeout, si = globalThis.setInterval;
    globalThis.setTimeout = (...a) => { timersSeen.push('t'); return st(...a); };
    globalThis.setInterval = (...a) => { timersSeen.push('i'); return si(...a); };
    try {
        setup([]);
        links.footholds.set('fh1', FH('fh1', 'jack', 'jack1'));
        sessions._replace('pc1', { ...TECH });
        assert.deepEqual(ids(), [], 'no sprite yet');
        const late = sprite('pc1');
        window.rooms.lab2 = { objects: { pc1: late } };
        marks.syncRoom('lab2');
        assert.deepEqual(ids(), ['pc1']);
        late.tintTopLeft = 0x4da6ff; // the proximity highlight's blue, read live
        assert.equal(marks.list()[0].tint, 0x4da6ff);
        marks.refresh();
        assert.equal(marks.list().length, 1);
    } finally { globalThis.setTimeout = st; globalThis.setInterval = si; }
    assert.deepEqual(timersSeen, []);
});

test('installCompromiseMarks is idempotent and the test bridge reads compromiseMarks()', async () => {
    setup([]);
    delete window.compromiseMarks;
    const a = installCompromiseMarks();
    assert.equal(installCompromiseMarks(), a);
    const bridge = readFileSync(join(js, 'systems/test-bridge/access.js'), 'utf8');
    assert.match(bridge, /compromiseMarks\(\) \{\s*return json\(window\.compromiseMarks\?\.list\?\.\(\)\) \|\| \[\];/);
    const rooms = readFileSync(join(js, 'core/rooms.js'), 'utf8');
    assert.match(rooms, /window\.compromiseMarks\?\.syncRoom\?\.\(roomId\)/);
});

// S3 client R1 m8: the bolt follows the sprite when its look (and size) is swapped after the mark
test('m8: a later pass re-places the bolt on a sprite whose size changed (a jack\'s planted look) and copies its visibility', () => {
    const jack = sprite('jack1');
    setup([jack]);
    links.footholds.set('fj', FH('fj', 'jack', 'jack1'));
    marks.refresh();
    assert.equal(images.length, 1);
    const before = { x: images[0].x, y: images[0].y };
    jack.displayWidth = 80; jack.displayHeight = 60;   // the planted sprite is bigger
    jack.visible = false;
    marks.syncRoom('lab');
    assert.notDeepEqual({ x: images[0].x, y: images[0].y }, before);
    assert.equal(images[0].x, jack.x + 80 * 0.5);
    assert.equal(images[0].y, jack.y - 60 * 0.5);
    assert.equal(images[0].visible, false);
    assert.equal(images.length, 1, 'no second bolt');
});

// S3 playtest PL6: a room's sprites are made hidden and shown later (revealRoom), and Phaser's
// `visible` is an accessor on the prototype that setVisible goes through. The bolt made while the
// sprite was hidden must show when the sprite does, and hide again with it.
test('PL6: a bolt made while its sprite is hidden shows when the room reveals it (Phaser-like visible accessor)', () => {
    class PhaserLikeSprite {
        constructor(base) { Object.assign(this, base); this._visible = true; }
        get visible() { return this._visible; }
        set visible(v) { this._visible = v; }
        setVisible(v) { this.visible = v; return this; }
    }
    const pc = new PhaserLikeSprite(sprite('pc1'));
    pc.setVisible(false);                       // rooms.js makes every sprite hidden
    setup([pc]);
    links.footholds.set('fh1', FH('fh1', 'jack', 'jack1'));
    sessions._replace('pc1', { ...TECH });
    marks.syncRoom('lab');                      // the room's sprites are made: the mark goes on, hidden
    assert.equal(images.length, 1);
    assert.equal(images[0].visible, false, 'hidden with its sprite while the room is hidden');
    pc.setVisible(true);                        // revealRoom
    assert.equal(images[0].visible, true, 'shown when the room reveals the sprite');
    pc.visible = false;                         // any other path that sets the property
    assert.equal(images[0].visible, false);
    pc.setVisible(true);
    links.footholds.delete('fh1');              // the foothold goes
    marks.refresh();
    assert.equal(images[0].destroyed, true);
    assert.equal(Object.prototype.hasOwnProperty.call(pc, 'visible'), false, 'the wrapper comes off with the mark');
    assert.equal(pc.visible, true);
});

test('PL6: a plain data `visible` on a stub sprite keeps its value through mark and unmark', () => {
    const pc = sprite('pc1');
    pc.visible = false;
    setup([pc]);
    links.footholds.set('fh1', FH('fh1', 'jack', 'jack1'));
    sessions._replace('pc1', { ...TECH });
    marks.refresh();
    assert.equal(images[0].visible, false);
    pc.visible = true;
    assert.equal(images[0].visible, true);
    assert.equal(pc.visible, true);
});

test('R4-4: a value set on a sprite with no visible while the mark is held is written back at unmark', async () => {
    const pc = sprite('pc1');
    assert.equal('visible' in pc, false);
    setup([pc]);
    links.footholds.set('fh1', FH('fh1', 'jack', 'jack1'));
    sessions._replace('pc1', { ...TECH });
    marks.refresh();
    pc.visible = false;
    assert.equal(images[0].visible, false);
    await sessions.signOut('pc1');
    assert.equal(Object.getOwnPropertyDescriptor(pc, 'visible').value, false, 'the value set while wrapped survives the unmark');
});

// S3 client R1 T5: a reload before the server's answer catches up
test('a reload whose loaded copy has no foothold held yet leaves the PC unmarked until the foothold loads', () => {
    const pc = sprite('pc1');
    setup([pc]);
    sessions.load({ pc1: { ...TECH } }, ['pc1']);   // the reload restores the copy; networkLinks holds nothing yet
    marks.syncRoom('lab');
    assert.deepEqual(ids(), []);
    links.footholds.set('fh1', FH('fh1', 'jack', 'other'));
    links.footholds.set('fh1', { ...FH('fh1', 'jack', 'other') });
    marks.refresh();
    assert.deepEqual(ids(), ['pc1'], 'the technique copy marks once its foothold is held');
});

// Ops core tidy (client), R4-1: the bolt joins its sprite's _fadeCompanions, so the behind-wall
// fade (behind-wall-fade.js addWithCompanions: scene, active !== false, visible) dims it too.
function fadePass(sprite, k) {
    for (const c of sprite._fadeCompanions || []) {
        if (c && c.scene && c.active !== false && c.visible) c.setAlpha(c.alpha * k);
    }
    sprite.alpha *= k;
}
test('R4-1: the bolt is a fade companion of its sprite, takes the fade\'s alpha, and leaves the set at unmark', () => {
    const pc = sprite('pc1');
    pc.alpha = 1;
    setup([pc]);
    const origAdd = pc.scene.add.image;
    pc.scene.add.image = (...a) => {
        const im = origAdd(...a);
        im.scene = pc.scene; im.active = true; im.alpha = 1; im.visible = true;
        im.setAlpha = function (v) { this.alpha = v; return this; };
        return im;
    };
    links.footholds.set('fh1', FH('fh1', 'jack', 'jack1'));
    sessions._replace('pc1', { ...TECH });
    assert.equal(images.length, 1);
    assert.ok(pc._fadeCompanions instanceof Set && pc._fadeCompanions.has(images[0]));
    fadePass(pc, 0.4);
    assert.equal(pc.alpha, 0.4);
    assert.equal(images[0].alpha, 0.4, 'the bolt dims with the sprite');
    marks.refresh();
    assert.equal(pc._fadeCompanions.size, 1, 'a second pass adds no second companion');
    links.footholds.delete('fh1');
    marks.refresh();
    assert.equal(pc._fadeCompanions.size, 0, 'removed before destroy');
    assert.equal(images[0].destroyed, true);
});

test('R4-1: an existing companion set is kept and only the bolt is added and removed', () => {
    const pc = sprite('pc1');
    const other = { id: 'x' };
    pc._fadeCompanions = new Set([other]);
    setup([pc]);
    links.footholds.set('fh1', FH('fh1', 'jack', 'jack1'));
    sessions._replace('pc1', { ...TECH });
    assert.equal(pc._fadeCompanions.size, 2);
    links.footholds.delete('fh1');
    marks.refresh();
    assert.deepEqual([...pc._fadeCompanions], [other]);
});

// R4-2: Phaser's setter is truthiness
test('R4-2: a falsy visible (0, null, undefined) hides the bolt; a truthy non-boolean shows it', () => {
    class P {
        constructor(base) { Object.assign(this, base); this._v = true; }
        get visible() { return !!this._v; }
        set visible(v) { this._v = v ? true : false; }
    }
    const pc = new P(sprite('pc1'));
    setup([pc]);
    links.footholds.set('fh1', FH('fh1', 'jack', 'jack1'));
    sessions._replace('pc1', { ...TECH });
    marks.refresh();
    for (const v of [0, null, undefined, '']) {
        pc.visible = v;
        assert.equal(images[0].visible, false, `visible = ${String(v)}`);
        pc.visible = 1;
        assert.equal(images[0].visible, true);
    }
    const d = sprite('d1'); d.visible = 0;
    setup([d]);
    links.footholds.set('fh2', FH('fh2', 'jack', 'd1'));
    marks.refresh();
    assert.equal(images[0].visible, false, '_place: a falsy data value hides the bolt');
});

// R4-3: the four missing asserts
class AccSprite {
    constructor(base) { Object.assign(this, base); this._visible = true; }
    get visible() { return this._visible; }
    set visible(v) { this._visible = v; }
    setVisible(v) { this.visible = v; return this; }
}
const markIt = () => { links.footholds.set('fh1', FH('fh1', 'jack', 'jack1')); sessions._replace('pc1', { ...TECH }); marks.refresh(); };
const unmarkIt = () => { links.footholds.delete('fh1'); marks.refresh(); };
test('R4-3: a second mark after an unmark wraps again, the new bolt follows, one own property', () => {
    const pc = new AccSprite(sprite('pc1'));
    setup([pc]);
    markIt();
    unmarkIt();
    assert.equal(Object.prototype.hasOwnProperty.call(pc, 'visible'), false);
    markIt();
    assert.equal(images.length, 2);
    assert.equal(Object.getOwnPropertyNames(pc).filter(n => n === 'visible').length, 1);
    pc.setVisible(false);
    assert.equal(images[1].visible, false);
    pc.setVisible(true);
    assert.equal(images[1].visible, true);
    assert.equal(images[0].destroyed, true);
});
test('R4-3: two passes while held leave one wrapper and one bolt that moves once', () => {
    const pc = new AccSprite(sprite('pc1'));
    setup([pc]);
    markIt();
    marks.refresh(); marks.refresh();
    assert.equal(images.length, 1);
    const own = Object.getOwnPropertyDescriptor(pc, 'visible');
    marks.refresh();
    assert.equal(Object.getOwnPropertyDescriptor(pc, 'visible').set, own.set, 'the same wrapper, not wrapped again');
    pc.setVisible(false);
    assert.equal(images[0].visible, false);
    unmarkIt();
    assert.equal(Object.prototype.hasOwnProperty.call(pc, 'visible'), false, 'one delete takes it all off');
    assert.equal(pc.visible, false, 'the value written through survives');
});
test('R4-3: a plain data visible is written back after unmark', () => {
    const pc = sprite('pc1');
    pc.visible = true;
    setup([pc]);
    markIt();
    pc.visible = false;
    unmarkIt();
    const d = Object.getOwnPropertyDescriptor(pc, 'visible');
    assert.equal(d.value, false);
    assert.equal(d.get, undefined);
});
test('R4-3: a sprite that already owns an accessor is not wrapped; unmark leaves it untouched', () => {
    const pc = sprite('pc1');
    let v = true;
    const acc = { configurable: true, enumerable: true, get: () => v, set: (x) => { v = x; } };
    Object.defineProperty(pc, 'visible', acc);
    setup([pc]);
    markIt();
    assert.equal(images.length, 1);
    assert.equal(Object.getOwnPropertyDescriptor(pc, 'visible').get, acc.get, 'declined to wrap');
    unmarkIt();
    const d = Object.getOwnPropertyDescriptor(pc, 'visible');
    assert.equal(d.get, acc.get);
    assert.equal(d.set, acc.set);
});
