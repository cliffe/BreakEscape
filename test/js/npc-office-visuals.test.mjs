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
    NpcOfficeVisuals, USE_SOUND_SCALE, firstOpaqueRow, iconAnchor, frameHeadRow, ICON_HEAD_GAP
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

// ── validator ────────────────────────────────────────────────────────────

const ruby = spawnSync('ruby', ['--version']);
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
