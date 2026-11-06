// Office life slice 3 (OFFICE_LIFE_PLAN 2.12): sprite action icons, the held item in hand,
// use sounds heard by room and distance, the room/dark rule, the seated typing bob and the
// validator's visuals lints. Run with: node test/js/npc-office-visuals.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pickIcon, pickIconEntry, resolveIcon, DEFAULT_ICONS } from '../../public/break_escape/js/systems/npc-action-icons.js';
import {
    useVolume, SoundLimiter, handOffset, heldPlacement, iconShown, roomIsDark, officeVisualsOn,
    NpcOfficeVisuals, USE_SOUND_SCALE
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

test('defaults come from existing art; hunger and rest stay text', () => {
    assert.deepEqual(DEFAULT_ICONS.caffeine, { sprite: 'coffee_cups1' });
    assert.deepEqual(DEFAULT_ICONS.thirst, { sprite: 'office-misc-cup' });
    assert.equal(DEFAULT_ICONS.work, 'icon:clipboard');
    assert.equal(DEFAULT_ICONS.social, 'icon:talk');
    assert.equal(DEFAULT_ICONS.curiosity, 'icon:mark-question');
    assert.equal(DEFAULT_ICONS.post, 'icon:mail-new');
    assert.equal(DEFAULT_ICONS.hunger, 'F');
    assert.equal(DEFAULT_ICONS.rest, 'Z');
});

test('a carry tagged post gets the post icon; an untagged carry gets curiosity', () => {
    assert.equal(pickIcon({ kind: 'carry', itemId: 'parcel', tag: 'post' }, {}, { id: 'amara_pc', satisfies: 'work' }), 'icon:mail-new');
    assert.equal(pickIcon({ kind: 'carry', itemId: 'mugs', tag: 'dirty_mugs' }, {}, null), 'icon:mark-question');
    assert.equal(pickIconEntry({ kind: 'carry', itemId: 'mugs', tag: 'dirty_mugs' }).key, 'curiosity');
});

test('a cooler use for social gets the social icon, not the first satisfies (thirst)', () => {
    const cooler = { id: 'water_cooler', satisfies: 'thirst', type: 'water_cooler1' };
    assert.equal(pickIcon({ kind: 'use', need: 'social' }, {}, cooler), 'icon:talk');
    assert.deepEqual(pickIcon({ kind: 'use', need: 'thirst' }, {}, cooler), { sprite: 'office-misc-cup' });
});

test('an explicit scenario entry wins: object id first, then the need', () => {
    const icons = { lounge_kettle: { sprite: 'kettle1' }, caffeine: '☕' };
    assert.deepEqual(pickIcon({ kind: 'use', need: 'caffeine' }, icons, { id: 'lounge_kettle', satisfies: 'caffeine' }), { sprite: 'kettle1' });
    assert.equal(pickIcon({ kind: 'use', need: 'caffeine' }, icons, { id: 'office_coffee', satisfies: 'caffeine' }), '☕');
    // the lab's glyphs stay until it opts in
    assert.equal(pickIcon({ kind: 'use', need: 'work' }, { work: '🖥' }, { id: 'pc', satisfies: 'work' }), '🖥');
    // an invalid value is skipped, not drawn
    assert.equal(pickIcon({ kind: 'use', need: 'work' }, { work: { nope: 1 } }, { id: 'pc' }), 'icon:clipboard');
});

// ── where icons show ─────────────────────────────────────────────────────

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
