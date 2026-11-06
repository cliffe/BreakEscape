// Office life slice 3 (OFFICE_LIFE_PLAN 2.12): sprite action icons, the held item in hand,
// use sounds heard by room and distance, the room/dark rule, the seated typing bob and the
// validator's visuals lints. Run with: node test/js/npc-office-visuals.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pickIcon, pickIconEntry, resolveIcon, DEFAULT_ICONS, NpcActionIcons, backingSize, ICON_TEXT_PX } from '../../public/break_escape/js/systems/npc-action-icons.js';
import {
    useVolume, SoundLimiter, handOffset, heldPlacement, iconShown, roomIsDark, officeVisualsOn,
    NpcOfficeVisuals, USE_SOUND_SCALE, firstOpaqueRow, iconAnchor, frameHeadRow, ICON_HEAD_GAP,
    lockCuesOn, lockCuePlan, ownRoomHearing, glyphLeft, glyphSequence, LOCK_GLYPHS, CHIME_SCALE, installNpcOfficeVisuals
} from '../../public/break_escape/js/systems/npc-office-visuals.js';
import { hearingLevel } from '../../public/break_escape/js/systems/room-hearing.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

// ── icons ────────────────────────────────────────────────────────────────

test('resolveIcon: icon: prefix, { sprite } and text, with the stand-in glyph', () => {
    assert.deepEqual(resolveIcon('icon:talk', 'S'), { kind: 'sprite', key: 'icon:talk', path: 'icons/talk.png', glyph: 'S' });
    assert.deepEqual(resolveIcon({ sprite: 'kettle1' }, 'K'), { kind: 'sprite', key: 'kettle1', path: 'objects/kettle1.png', glyph: 'K' });
    assert.equal(resolveIcon({ sprite: 'kettle1', text: 'T' }).glyph, 'T');
    assert.deepEqual(resolveIcon('PC'), { kind: 'text', glyph: 'PC' });
    assert.deepEqual(resolveIcon('icon:', 'x'), { kind: 'text', glyph: 'icon:' });
    assert.deepEqual(resolveIcon(null, '•'), { kind: 'text', glyph: '•' });
});

test('defaults are the npc-* icon set (slice 3b); fallback stays text', () => {
    assert.equal(DEFAULT_ICONS.caffeine, 'icon:npc-caffeine');
    assert.equal(DEFAULT_ICONS.thirst, 'icon:npc-thirst');
    assert.equal(DEFAULT_ICONS.work, 'icon:npc-work');
    assert.equal(DEFAULT_ICONS.social, 'icon:npc-social');
    assert.equal(DEFAULT_ICONS.curiosity, 'icon:npc-curiosity');
    assert.equal(DEFAULT_ICONS.post, 'icon:npc-post');
    assert.equal(DEFAULT_ICONS.hunger, 'icon:npc-hunger');
    assert.equal(DEFAULT_ICONS.rest, 'icon:npc-rest');
    assert.equal(DEFAULT_ICONS.fallback, '•');
});

test('a carry tagged post gets the post icon; an untagged carry gets curiosity', () => {
    assert.equal(pickIcon({ kind: 'carry', itemId: 'parcel', tag: 'post' }, {}, { id: 'amara_pc', satisfies: 'work' }), 'icon:npc-post');
    assert.equal(pickIcon({ kind: 'carry', itemId: 'mugs', tag: 'dirty_mugs' }, {}, null), 'icon:npc-curiosity');
    assert.equal(pickIconEntry({ kind: 'carry', itemId: 'mugs', tag: 'dirty_mugs' }).key, 'curiosity');
});

test('a cooler use for social gets the social icon, not the first satisfies (thirst)', () => {
    const cooler = { id: 'water_cooler', satisfies: 'thirst', type: 'water_cooler1' };
    assert.equal(pickIcon({ kind: 'use', need: 'social' }, {}, cooler), 'icon:npc-social');
    assert.equal(pickIcon({ kind: 'use', need: 'thirst' }, {}, cooler), 'icon:npc-thirst');
});

test('an explicit scenario entry wins: object id first, then the need', () => {
    const icons = { lounge_kettle: { sprite: 'kettle1' }, caffeine: '☕' };
    assert.deepEqual(pickIcon({ kind: 'use', need: 'caffeine' }, icons, { id: 'lounge_kettle', satisfies: 'caffeine' }), { sprite: 'kettle1' });
    assert.equal(pickIcon({ kind: 'use', need: 'caffeine' }, icons, { id: 'office_coffee', satisfies: 'caffeine' }), '☕');
    // the lab's glyphs stay until it opts in
    assert.equal(pickIcon({ kind: 'use', need: 'work' }, { work: '🖥' }, { id: 'pc', satisfies: 'work' }), '🖥');
    // an invalid value is skipped, not drawn
    assert.equal(pickIcon({ kind: 'use', need: 'work' }, { work: { nope: 1 } }, { id: 'pc' }), 'icon:npc-work');
});

// ── where icons show ─────────────────────────────────────────────────────

// ── icon placement: just above the head, not the 80 px frame's top (game 603: Pierce's coffee
// icon floated clear of her head beside the next desk's lamp) ─────────────────────────────

test('firstOpaqueRow: the first row with any alpha; null for a blank frame', () => {
    const alpha = (x, y) => (y >= 14 && x >= 28 && x <= 52 ? 255 : 0);
    assert.equal(firstOpaqueRow(alpha, 80, 80), 14);
    assert.equal(firstOpaqueRow(() => 0, 80, 80), null);
});

test('iconAnchor: head row minus the gap, scaled; the old +6 only without pixel data', () => {
    const top = { x: 200.4, y: 123 };
    assert.deepEqual(iconAnchor(top, 14), { x: 200, y: 123 + 14 - ICON_HEAD_GAP });
    assert.deepEqual(iconAnchor(top, 13, 2), { x: 200, y: 123 + 26 - ICON_HEAD_GAP });
    assert.deepEqual(iconAnchor(top, null), { x: 200, y: 129 });
});

test('backingSize: a tall emoji line box does not make a tall backing', () => {
    // Live, "☕" at 16 px measured 34 px high and the box stood 42 px above the head
    const emoji = backingSize('text', { width: 18, height: 32 });
    assert.ok(emoji.h <= ICON_TEXT_PX + 6, `emoji box ${emoji.h} px high`);
    assert.deepEqual(backingSize('text', { width: 20, height: 19 }), { w: 28, h: 21 });
    assert.deepEqual(backingSize('sprite', { width: 16, height: 12 }), { w: 22, h: 16 });
});

/** A fake Phaser scene and NPC sprite for NpcActionIcons.update, with a canvas that reads the frame's alpha. */
function iconRig({ frameName = 'sit_north_frame_000', headRow = 13, textureReady = false } = {}) {
    const objs = [];
    const mk = (kind) => {
        const o = { kind, x: 0, y: 0, visible: true, w: 0, h: 0, data: {}, scene: null,
            setOrigin() { return o; }, setVisible(v) { o.visible = v; return o; }, setPosition(x, y) { o.x = x; o.y = y; return o; },
            setSize(w, h) { o.w = w; o.h = h; return o; }, setTexture(k) { o.key = k; o.width = 16; o.height = 12; return o; },
            setText(t) { o.text = t; o.width = 18; o.height = 32; return o; }, setDepth() { return o; }, setScale(s) { o.scale = s; return o; },
            setData(k, v) { o.data[k] = v; return o; } };
        objs.push(o);
        return o;
    };
    const scene = {
        add: {
            rectangle: () => mk('bg'), text: () => mk('text'), image: () => mk('img'),
            container: (x, y, kids) => { const c = mk('box'); c.kids = kids; c.scene = scene; return c; }
        },
        textures: { exists: () => textureReady },
        load: { image() {}, once() {}, isLoading: () => true, start() {} }
    };
    const sprite = {
        x: 200, y: 163, scaleY: 1, active: true, visible: true, destroyed: false, scene,
        texture: { key: `rig_${frameName}_${headRow}` },
        frame: { name: frameName, cutX: 0, cutY: 0, cutWidth: 80, cutHeight: 80, source: { image: {} } },
        getTopCenter() { return { x: this.x, y: this.y - 40 }; }
    };
    const job = { kind: 'use', need: 'caffeine', targetId: 'coffee_station', phase: 'goto_target', windingUp: false };
    globalThis.window = {
        gameScenario: { actionIcons: { coffee_station: '☕' } },
        currentPlayerRoom: 'office',
        rooms: {},
        npcNeedsSystem: { states: new Map([['pierce', {}]]), getState: () => ({ job }) },
        npcBehaviorManager: { getBehavior: () => ({ sprite, roomId: 'office' }) }
    };
    globalThis.document = {
        createElement: () => ({ getContext: () => ({
            drawImage() {},
            getImageData: (x0, y0, w, h) => {
                const data = new Uint8ClampedArray(w * h * 4);
                for (let y = headRow; y < h; y++) for (let x = 28; x < 52; x++) data[(y * w + x) * 4 + 3] = 255;
                return { data };
            }
        }) })
    };
    return { scene, sprite, job, objs };
}

function cleanupRig() { delete globalThis.window; delete globalThis.document; }

test('action icon: anchored just above a seated NPC\'s head; one of text or sprite, never both', () => {
    const rig = iconRig({ frameName: 'sit_north_frame_000', headRow: 13 });
    try {
        assert.equal(frameHeadRow(rig.sprite), 13);
        const icons = new NpcActionIcons();
        icons.update();
        const ic = icons.icons.get('pierce');
        // frame top 123, head at row 13 -> 136; the box's bottom 2 px above it
        assert.deepEqual([ic.box.x, ic.box.y], [200, 136 - ICON_HEAD_GAP]);
        assert.equal(ic.text.visible, true);
        assert.equal(ic.img.visible, false);
        assert.ok(ic.bg.h <= ICON_TEXT_PX + 6, `emoji backing ${ic.bg.h} px`);
        assert.equal(ic.text.y, -ic.bg.h / 2, 'glyph centred in its box');
    } finally { cleanupRig(); }
});

test('action icon: a sprite icon hides the text stand-in once its texture is ready; standing NPC too', () => {
    const rig = iconRig({ frameName: 'walk_east_frame_000', headRow: 15, textureReady: false });
    try {
        window.gameScenario.actionIcons = {};          // default caffeine icon (npc-caffeine)
        const icons = new NpcActionIcons();
        icons.update();
        let ic = icons.icons.get('pierce');
        assert.deepEqual([ic.text.visible, ic.img.visible], [true, false], 'stand-in while loading');
        rig.scene.textures.exists = () => true;
        icons.update();
        ic = icons.icons.get('pierce');
        assert.deepEqual([ic.text.visible, ic.img.visible], [false, true], 'texture only once ready');
        assert.deepEqual([ic.box.x, ic.box.y], [200, 123 + 15 - ICON_HEAD_GAP]);
    } finally { cleanupRig(); }
});

test('iconShown: only the player\'s room, and not while it is dark', () => {
    assert.equal(iconShown({ npcRoom: 'office', playerRoom: 'office' }), true);
    assert.equal(iconShown({ npcRoom: 'kitchen', playerRoom: 'office' }), false);
    assert.equal(iconShown({ npcRoom: 'office', playerRoom: 'office', dark: true }), false);
    assert.equal(iconShown({ npcRoom: null, playerRoom: 'office' }), false);
});

test('roomIsDark: no lighting or an unmanaged room counts as lit; below 0.5 is dark', () => {
    assert.equal(roomIsDark('office', null), false);
    const lighting = { rooms: new Map([['office', { lvl: 1 }], ['store', { lvl: 0.2 }]]), roomLevel: s => s.lvl };
    assert.equal(roomIsDark('office', lighting), false);
    assert.equal(roomIsDark('store', lighting), true);
    assert.equal(roomIsDark('kitchen', lighting), false);
});

// ── held item ────────────────────────────────────────────────────────────

test('hand offset per facing: in front facing south, east and west; behind facing north', () => {
    for (const d of ['down', 'left', 'right', 'down-left', 'down-right']) assert.equal(handOffset(d).front, true, d);
    for (const d of ['up', 'up-left', 'up-right']) assert.equal(handOffset(d).front, false, d);
    assert.ok(handOffset('left').dx < 0 && handOffset('right').dx > 0);
    assert.deepEqual(handOffset('sideways'), handOffset('down'));
});

test('heldPlacement: centred on the hand whatever the origin; depth just above or below the NPC', () => {
    const npc = { x: 100, y: 200, depth: 230.5, visible: true };
    const item = { displayWidth: 16, displayHeight: 14, originX: 0, originY: 0 };
    const s = heldPlacement(npc, item, 'down');
    const h = handOffset('down');
    assert.equal(s.x + 8, 100 + h.dx);
    assert.equal(s.y + 7, 200 + h.dy);
    assert.ok(s.depth > npc.depth);
    const n = heldPlacement(npc, item, 'up');
    assert.ok(n.depth < npc.depth);
    const c = heldPlacement(npc, { ...item, originX: 0.5, originY: 0.5 }, 'down');
    assert.equal(c.x, 100 + h.dx);
    assert.equal(c.y, 200 + h.dy);
});

test('followHeld: the held item follows its NPC and hides and shows with it', () => {
    const calls = [];
    const item = { x: 0, y: 0, displayWidth: 16, displayHeight: 14, originX: 0, originY: 0, visible: true,
        setPosition(x, y) { this.x = x; this.y = y; }, setDepth(d) { this.depth = d; }, setVisible(v) { this.visible = v; calls.push(v); } };
    const npc = { x: 300, y: 300, depth: 340.5, visible: true, active: true };
    const behaviour = { sprite: npc, direction: 'left' };
    globalThis.window = {
        npcNeedsSystem: { states: new Map([['amara', { job: { carrying: true, itemId: 'parcel' } }], ['tom', { job: null }]]) },
        npcBehaviorManager: { getBehavior: id => (id === 'amara' ? behaviour : null) },
        npcManager: { getNPC: id => (id === 'amara' ? { _needsCarried: { parcel: { sprite: item } } } : null) }
    };
    try {
        const v = new NpcOfficeVisuals(null);
        v.followHeld();
        const p = heldPlacement(npc, item, 'left');
        assert.deepEqual([item.x, item.y, item.depth], [p.x, p.y, p.depth]);
        npc.visible = false;
        v.followHeld();
        assert.equal(item.visible, false);
        npc.visible = true; npc.x = 340; behaviour.direction = 'up';
        v.followHeld();
        assert.equal(item.visible, true);
        assert.ok(item.depth < npc.depth, 'behind the body facing north');
        assert.deepEqual(calls, [false, true]);
    } finally { delete globalThis.window; }
});

// ── sounds ───────────────────────────────────────────────────────────────

test('hearingLevel: own room 1, through a door 0.4, elsewhere 0', () => {
    const rooms = { office: { doorSprites: [{ doorProperties: { connectedRoom: 'kitchen' } }] } };
    assert.equal(hearingLevel('office', 'office', rooms), 1);
    assert.equal(hearingLevel('kitchen', 'office', rooms), 0.4);
    assert.equal(hearingLevel('lounge', 'office', rooms), 0);
    assert.equal(hearingLevel(null, 'office', rooms), 1);
});

test('useVolume: effects x 0.4 x linear fall-off to zero at eight tiles x hearing', () => {
    assert.equal(useVolume({ effects: 1, distance: 0, hearing: 1 }), USE_SOUND_SCALE);
    assert.ok(Math.abs(useVolume({ effects: 1, distance: 128, hearing: 1 }) - 0.2) < 1e-9, 'half way at four tiles');
    assert.equal(useVolume({ effects: 1, distance: 256, hearing: 1 }), 0);
    assert.equal(useVolume({ effects: 1, distance: 400, hearing: 1 }), 0);
    assert.ok(Math.abs(useVolume({ effects: 1, distance: 0, hearing: 0.4 }) - 0.16) < 1e-9);
    assert.equal(useVolume({ effects: 1, distance: 10, hearing: 0 }), 0);
    assert.ok(Math.abs(useVolume({ effects: 0.5, distance: 0, hearing: 1 }) - 0.2) < 1e-9);
});

test('SoundLimiter: one sound per second overall', () => {
    const l = new SoundLimiter(1000);
    assert.equal(l.allow(0), true);
    assert.equal(l.allow(500), false);
    assert.equal(l.allow(999), false);
    assert.equal(l.allow(1000), true);
});

function soundWorld({ playerRoom = 'kitchen', player = { x: 100, y: 100 }, noLighting = true } = {}) {
    const played = [], emitted = [];
    const scene = { sound: { mute: false, play: (key, cfg) => played.push({ key, volume: cfg.volume }) }, cache: { audio: { exists: () => true } } };
    globalThis.window = {
        currentPlayerRoom: playerRoom,
        player,
        rooms: { office: { doorSprites: [{ doorProperties: { connectedRoom: 'kitchen' } }] }, kitchen: { doorSprites: [{ doorProperties: { connectedRoom: 'office' } }] }, lounge: { doorSprites: [] } },
        lightingSystem: noLighting ? null : undefined,
        soundManager: { enabled: true, masterVolume: 1, volumeSettings: { effects: 1 } },
        eventDispatcher: { emit: (name, data) => emitted.push({ name, data }) },
        npcBehaviorManager: { getBehavior: () => ({ sprite: { x: 100, y: 164 }, roomId: 'kitchen' }) },
        npcNeedsSystem: { world: { getObject: id => ({ id, roomId: 'kitchen', affordance: id === 'water_cooler' ? { useSound: 'drink_gulp' } : {} }) } }
    };
    return { v: new NpcOfficeVisuals(scene), played, emitted };
}

test('playAt: a one-shot via scene.sound, not soundManager; heard in the room, quieter through a door, silent beyond', () => {
    try {
        let { v, played } = soundWorld({ playerRoom: 'kitchen' });
        assert.ok(Math.abs(v.playAt('drink_gulp', 100, 164, 'kitchen') - 0.4 * (1 - 64 / 256)) < 1e-9);
        assert.equal(played.length, 1);
        ({ v, played } = soundWorld({ playerRoom: 'office' }));
        assert.ok(Math.abs(v.playAt('drink_gulp', 100, 164, 'kitchen') - 0.4 * 0.4 * (1 - 64 / 256)) < 1e-9, 'through the door');
        ({ v, played } = soundWorld({ playerRoom: 'lounge' }));
        assert.equal(v.playAt('drink_gulp', 100, 164, 'kitchen'), 0);
        assert.equal(played.length, 0);
        assert.equal(v.playLog.at(-1).hearing, 0, 'logged with its hearing level');
        // no lighting system at all (window.lightingSystem null): still room-limited
        assert.equal(globalThis.window.lightingSystem, null);
    } finally { delete globalThis.window; }
});

test('playAt: rate limit, a sound not loaded, and the sound manager switched off', () => {
    try {
        const { v, played } = soundWorld();
        assert.ok(v.playAt('drink_gulp', 100, 100, 'kitchen') > 0);
        assert.equal(v.playAt('eat_snack', 100, 100, 'kitchen'), 0, 'second within a second');
        assert.equal(v.playLog.at(-1).reason, 'rate');
        v.limiter.last = -Infinity;
        v.scene.cache.audio.exists = () => false;
        assert.equal(v.playAt('nope', 100, 100, 'kitchen'), 0);
        assert.equal(v.playLog.at(-1).reason, 'not loaded');
        v.scene.cache.audio.exists = () => true;
        globalThis.window.soundManager.enabled = false;
        assert.equal(v.playAt('drink_gulp', 100, 100, 'kitchen'), 0);
        assert.equal(played.length, 1);
    } finally { delete globalThis.window; }
});

test('onUsed: plays the object\'s useSound at the NPC and emits npc_use_heard; no useSound, no sound', () => {
    try {
        const { v, played, emitted } = soundWorld();
        v.onUsed({ npcId: 'grace', objectId: 'water_cooler' });
        assert.equal(played[0].key, 'drink_gulp');
        assert.equal(emitted[0].name, 'npc_use_heard:water_cooler');
        assert.equal(emitted[0].data.npcId, 'grace');
        assert.equal(emitted[0].data.hearing, 1);
        v.limiter.last = -Infinity;
        v.onUsed({ npcId: 'grace', objectId: 'microwave' });
        assert.equal(played.length, 1);
    } finally { delete globalThis.window; }
});

test('officeVisualsOn: on unless the scenario says false', () => {
    assert.equal(officeVisualsOn({}), true);
    assert.equal(officeVisualsOn(null), true);
    assert.equal(officeVisualsOn({ officeVisuals: false }), false);
});

// ── lock cues (slice 16, OFFICE_LIFE_PLAN 12.2) ──────────────────────────

const ruby = spawnSync('ruby', ['--version']);

function fakeAudioContext(log) {
    const node = () => ({ connect: (n) => n || node(), gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } });
    return {
        currentTime: 0, destination: {},
        createGain: () => node(),
        createOscillator: () => { const o = { ...node(), type: '', frequency: { setValueAtTime: (hz) => log.push(hz) }, start() {}, stop() {} }; return o; }
    };
}

function cueWorld({ playerRoom = 'office', lighting = null, scenario = {}, texturesLoaded = true } = {}) {
    const notes = [], emitted = [], made = [], timers = [], flashes = [];
    const go = (kind) => { const g = { kind, x: 0, y: 0, visible: true, destroyed: false, scene: {} };
        for (const m of ['setOrigin', 'setDepth', 'setText']) g[m] = () => g;
        g.setTexture = (k) => { g.texture = k; return g; };
        g.setPosition = (x, y) => { g.x = x; g.y = y; return g; };
        g.setVisible = (v) => { g.visible = v; return g; };
        g.setSize = (w, h) => { g.w = w; g.h = h; return g; };
        g.destroy = () => { g.destroyed = true; g.scene = null; };
        made.push(g); return g; };
    const scene = {
        sound: { mute: false, play: () => {}, context: fakeAudioContext(notes) },
        cache: { audio: { exists: () => false } },   // the chimes have no file
        add: { rectangle: () => go('bg'), image: () => go('img'), text: () => go('text'), container: (x, y, kids) => { const c = go('box'); c.x = x; c.y = y; c.kids = kids; return c; } },
        textures: { exists: () => texturesLoaded },
        time: { delayedCall: (ms, fn) => { const t = { ms, fn, remove() {} }; timers.push(t); return t; } }
    };
    const pc = { x: 100, y: 100, scenarioData: { id: 'amara_pc' }, getCenter: () => ({ x: 100, y: 100 }), getTopCenter: () => ({ x: 100, y: 84 }) };
    globalThis.window = {
        currentPlayerRoom: playerRoom, player: { x: 100, y: 160 },
        gameScenario: scenario,
        rooms: { office: { objects: { amara_pc: pc }, doorSprites: [{ doorProperties: { connectedRoom: 'kitchen' } }] }, kitchen: { objects: {}, doorSprites: [{ doorProperties: { connectedRoom: 'office' } }] } },
        lightingSystem: lighting ? { flash: (id, kind) => { flashes.push([id, kind]); return true; } } : null,
        soundManager: { enabled: true, masterVolume: 1, volumeSettings: { effects: 1 } },
        eventDispatcher: { emit: (name, data) => emitted.push({ name, data }) }
    };
    return { v: new NpcOfficeVisuals(scene), notes, emitted, made, timers, flashes };
}

test('lockCuePlan: flash with lighting, glyph without; chime on leave and return only; late shows nothing', () => {
    assert.deepEqual(lockCuePlan({ how: 'leave', locked: true }, { lighting: true }), { flash: 'lock', glyph: false, chime: 'screen_lock' });
    assert.deepEqual(lockCuePlan({ how: 'return', locked: false }, { lighting: false }), { flash: null, glyph: true, chime: 'screen_unlock' });
    assert.deepEqual(lockCuePlan({ how: 'auto', locked: true }, { lighting: true }), { flash: 'lock', glyph: false, chime: null });
    assert.deepEqual(lockCuePlan({ how: 'late', locked: true }, { lighting: false }), { flash: null, glyph: false, chime: null });
    assert.equal(lockCuesOn({}), true);
    assert.equal(lockCuesOn({ lockCues: false }), false);
});

test('ownRoomOnly: 0 through a door and for a missing room id; playAt logs it', () => {
    assert.equal(ownRoomHearing('office', 'office'), 1);
    assert.equal(ownRoomHearing('kitchen', 'office'), 0);
    assert.equal(ownRoomHearing(undefined, 'office'), 0);
    assert.equal(hearingLevel(undefined, 'office', {}), 1, 'the plain hearing level trusts a missing room id');
    try {
        const { v } = cueWorld({ playerRoom: 'office' });
        const synth = () => true;
        assert.equal(v.playAt('screen_lock', 100, 100, 'kitchen', {}, { ownRoomOnly: true, channel: 'chime', synth }), 0, 'through a door');
        assert.equal(v.playLog.at(-1).hearing, 0);
        assert.equal(v.playAt('screen_lock', 100, 100, undefined, {}, { ownRoomOnly: true, channel: 'chime', synth }), 0, 'no room id');
        assert.ok(v.playAt('screen_lock', 100, 100, 'office', {}, { ownRoomOnly: true, channel: 'chime', synth }) > 0);
    } finally { delete globalThis.window; }
});

test('limiter channels: a use sound and a chime in the same second both play', () => {
    try {
        const { v } = cueWorld();
        v.scene.cache.audio.exists = () => true;
        assert.ok(v.playAt('drink_gulp', 100, 100, 'office') > 0);
        assert.ok(v.playAt('screen_lock', 100, 100, 'office', {}, { ownRoomOnly: true, channel: 'chime', synth: () => true }) > 0);
        assert.equal(v.playAt('eat_snack', 100, 100, 'office'), 0, 'the use channel still limits itself');
        assert.equal(v.playLog.at(-1).reason, 'rate');
    } finally { delete globalThis.window; }
});

test('a lock on leave without lighting: padlock glyph (open then closed, bodies aligned), chime played and heard', () => {
    try {
        const { v, notes, emitted, made, timers, flashes } = cueWorld();
        v.onScreenChanged({ objectId: 'amara_pc', ownerId: 'amara', locked: true, how: 'leave' });
        assert.equal(flashes.length, 0);
        const img = made.find(g => g.kind === 'img');
        assert.equal(img.texture, LOCK_GLYPHS.open.key, 'starts open');
        const openLeft = img.x;
        timers.find(t => t.ms === 300).fn();
        assert.equal(img.texture, LOCK_GLYPHS.closed.key, 'then closes');
        // the body (15 px) sits at the same place in both icons
        assert.equal(openLeft + LOCK_GLYPHS.open.bodyX0, img.x + LOCK_GLYPHS.closed.bodyX0);
        assert.equal(glyphLeft('closed'), -7);
        assert.equal(glyphLeft('open'), -15);
        assert.deepEqual(glyphSequence(false), ['closed', 'open']);
        const box = made.find(g => g.kind === 'box');
        assert.equal(box.y, 82, 'just above the screen');
        timers.find(t => t.ms === 1000).fn();
        assert.equal(box.destroyed, true, 'gone after a second');
        // the chime: synthesised, falling notes, own channel, played (approved)
        assert.deepEqual(notes, [880, 587.33]);
        const log = v.playLog.at(-1);
        assert.equal(log.key, 'screen_lock');
        assert.equal(log.played, true);
        assert.equal(log.channel, 'chime');
        assert.ok(!('reason' in log));
        assert.ok(Math.abs(log.volume - Math.round(USE_SOUND_SCALE * CHIME_SCALE * (1 - 60 / 256) * 1000) / 1000) < 1e-9);
        const heard = emitted.find(e => e.name === 'workstation_lock_heard:amara_pc');
        assert.equal(heard.data.locked, true);
        assert.equal(heard.data.how, 'leave');
        assert.ok(heard.data.volume > 0);
        assert.equal(v.cueLog.at(-1).glyph, true);
    } finally { delete globalThis.window; }
});

test('with lighting: the flash and no glyph; the return chime rises; an auto-lock flashes with no chime', () => {
    try {
        const { v, notes, made, flashes, emitted } = cueWorld({ lighting: true });
        v.onScreenChanged({ objectId: 'amara_pc', ownerId: 'amara', locked: false, how: 'return' });
        assert.deepEqual(flashes, [['amara_pc', 'unlock']]);
        assert.equal(made.length, 0, 'no glyph with lighting');
        assert.deepEqual(notes, [587.33, 880]);
        v.onScreenChanged({ objectId: 'amara_pc', ownerId: 'amara', locked: true, how: 'auto' });
        assert.deepEqual(flashes[1], ['amara_pc', 'lock']);
        assert.equal(notes.length, 2, 'no chime for an auto-lock');
        assert.equal(emitted.filter(e => e.name.startsWith('workstation_lock_heard')).length, 1);
    } finally { delete globalThis.window; }
});

test('from the kitchen the chime is not heard (logged at 0, no event); a late decision shows nothing', () => {
    try {
        const { v, notes, emitted, made } = cueWorld({ playerRoom: 'kitchen' });
        v.onScreenChanged({ objectId: 'amara_pc', ownerId: 'amara', locked: true, how: 'leave' });
        assert.equal(notes.length, 0);
        assert.equal(v.playLog.at(-1).volume, 0);
        assert.equal(v.playLog.at(-1).hearing, 0);
        assert.equal(emitted.length, 0);
        const n = made.length;
        v.onScreenChanged({ objectId: 'amara_pc', ownerId: 'amara', locked: true, how: 'late' });
        assert.equal(made.length, n);
        assert.equal(v.playLog.length, 1);
    } finally { delete globalThis.window; }
});

test('lockCues: false shows nothing; officeVisuals: false with lockCues on still cues and installs', () => {
    try {
        let w = cueWorld({ scenario: { lockCues: false } });
        w.v.onScreenChanged({ objectId: 'amara_pc', ownerId: 'amara', locked: true, how: 'leave' });
        assert.equal(w.made.length, 0);
        assert.equal(w.v.playLog.length, 0);
        w = cueWorld({ scenario: { officeVisuals: false } });
        w.v.onScreenChanged({ objectId: 'amara_pc', ownerId: 'amara', locked: true, how: 'leave' });
        assert.ok(w.made.length > 0, 'glyph shown');
        assert.equal(w.v.playLog.at(-1).played, true);
        delete globalThis.window.npcOfficeVisuals;
        assert.ok(installNpcOfficeVisuals(null), 'installs under lockCues alone');
        globalThis.window.gameScenario = { officeVisuals: false, lockCues: false };
        delete globalThis.window.npcOfficeVisuals;
        assert.equal(installNpcOfficeVisuals(null), null, 'both off: not installed');
    } finally { delete globalThis.window; }
});

test('glyph text stand-ins until the icons have loaded', () => {
    try {
        const { v, made } = cueWorld({ texturesLoaded: false });
        v.onScreenChanged({ objectId: 'amara_pc', ownerId: 'amara', locked: false, how: 'return' });
        assert.equal(made.find(g => g.kind === 'img').visible, false);
        assert.equal(made.find(g => g.kind === 'text').visible, true);
    } finally { delete globalThis.window; }
});

test('validator (slice 16): screenHabit bounds, nothing to lock, shadowed habit; autoLockSeconds on a non-workstation or a station that always locks', { skip: ruby.status !== 0 && 'ruby not found' }, () => {
    const scenario = { lockCues: 'yes', rooms: { office: { objects: [
        { id: 'pc_amara', type: 'pc1', workstation: true },
        { id: 'pc_tom', type: 'pc1', lockChance: 0.5 },
        { id: 'pc_san', type: 'pc1', workstation: true, autoLockSeconds: 30 },
        { id: 'pc_def', type: 'pc1', workstation: true, autoLockSeconds: 30 },
        { id: 'pc_on', type: 'pc1', locksScreenOnLeave: true, autoLockSeconds: 30 },
        { id: 'lamp', type: 'lamp1', autoLockSeconds: 10 },
        { id: 'pc_bad', type: 'pc1', workstation: true, autoLockSeconds: -1 }
    ], npcs: [
        { id: 'amara', needsHome: 'pc_amara', screenHabit: { lockIfAwayOverSeconds: 20 } },
        { id: 'tom', needsHome: 'pc_tom', screenHabit: { lockChance: 0 } },
        { id: 'san', needsHome: 'pc_san', screenHabit: { lockChance: 0 } },
        { id: 'def', needsHome: 'pc_def' },
        { id: 'loner', screenHabit: { lockChance: 2, lockIfAwayOverSeconds: 'x', colour: 1 } }
    ] } } };
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_npc_needs.rb'))}
      puts JSON.generate(ValidateNpcNeeds.check(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    const issues = JSON.parse(r.stdout.trim().split('\n').pop()).filter(s => /screenHabit|autoLockSeconds|lockCues/.test(s));
    const has = f => issues.some(s => s.includes(f));
    assert.ok(has('ERROR: lockCues must be true or false'));
    assert.ok(!has("NPC 'amara'"), 'a habit on a plain workstation is fine');
    assert.ok(has("WARNING: NPC 'tom' screenHabit never applies"));
    assert.ok(!has("NPC 'san'"));
    assert.ok(has("ERROR: NPC 'loner' screenHabit.lockChance"));
    assert.ok(has("ERROR: NPC 'loner' screenHabit.lockIfAwayOverSeconds"));
    assert.ok(has("WARNING: NPC 'loner' screenHabit has unknown field 'colour'"));
    assert.ok(has("WARNING: NPC 'loner' screenHabit but the NPC owns no workstation"));
    assert.ok(!has("'pc_san' autoLockSeconds"), 'the habit leaves it open');
    assert.ok(has("WARNING: object 'pc_def' autoLockSeconds never applies"), 'no habit: always locks');
    assert.ok(has("WARNING: object 'pc_on' autoLockSeconds never applies"));
    assert.ok(has("WARNING: object 'lamp' autoLockSeconds is set on an object that is not a workstation"));
    assert.ok(has("ERROR: object 'pc_bad' autoLockSeconds must be"));
});

// ── validator ────────────────────────────────────────────────────────────

test('validator: oversized held item, unloaded useSound and a missing icon texture are warnings', { skip: ruby.status !== 0 && 'ruby not found' }, () => {
    const scenario = {
        actionIcons: { a: 'icon:no_such_icon', b: { sprite: 'coffee_cups1' }, c: 'C' },
        rooms: { office: { objects: [
            { id: 'big', type: 'pc1', needsTag: 'post' },
            { id: 'small', type: 'm09_box_taped1', needsTag: 'post' },
            { id: 'cooler', type: 'water_cooler1', affordance: { satisfies: 'thirst', useSound: 'no_such_sound' } },
            { id: 'cooler2', type: 'water_cooler1', affordance: { satisfies: 'thirst', useSound: 'drink_gulp' } }
        ] } }
    };
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_npc_needs.rb'))}
      puts JSON.generate(ValidateNpcNeeds.check(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    const issues = JSON.parse(r.stdout.trim().split('\n').pop());
    const has = f => issues.some(s => s.includes(f));
    assert.ok(has("needsTag item 'big'"));
    assert.ok(!has("needsTag item 'small'"));
    assert.ok(has("'cooler' affordance.useSound 'no_such_sound'"));
    assert.ok(!has("'cooler2'"));
    assert.ok(has("actionIcons 'a'"));
    assert.ok(!has("actionIcons 'b'") && !has("actionIcons 'c'"));
});

test('validator (slice 21): swivel on an NPC with no needs and los.enabled on a needs NPC are warnings; a bad swivelChance is an error', { skip: ruby.status !== 0 && 'ruby not found' }, () => {
    const needs = { work: { decayPerMin: 1, urgentAt: 20 } };
    const scenario = { rooms: { office: { objects: [{ id: 'desk_pc', type: 'pc1' }], npcs: [
        { id: 'guard', swivel: false },
        { id: 'watcher', needs, needsHome: 'desk_pc', los: { enabled: true } },
        { id: 'quiet_watcher', needs, needsHome: 'desk_pc', los: { enabled: true }, swivel: false },
        { id: 'jumpy', needs, needsHome: 'desk_pc', swivelChance: 2 },
        { id: 'ok', needs, needsHome: 'desk_pc', swivelChance: 0.1 }
    ] } } };
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_npc_needs.rb'))}
      puts JSON.generate(ValidateNpcNeeds.check(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    const issues = JSON.parse(r.stdout.trim().split('\n').pop()).filter(s => /swivel|los\.enabled/.test(s));
    const has = f => issues.some(s => s.includes(f));
    assert.ok(has("WARNING: NPC 'guard' sets swivel"));
    assert.ok(has("WARNING: NPC 'watcher' is a needs NPC with los.enabled"));
    assert.ok(!has("'quiet_watcher'"));
    assert.ok(has("ERROR: NPC 'jumpy' swivelChance"));
    assert.ok(!has("'ok'"));
});
