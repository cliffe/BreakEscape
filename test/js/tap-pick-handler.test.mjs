// The scene's real pointerdown handler from core/game.js, run over plain sprites (code review R1 m6).
// game.js cannot be imported in node (Phaser, the whole engine), so this test cuts the handler and
// the helpers it calls (findObjectsAtPosition, gatherInteractablesNearClick, findNPCAtPosition,
// walkToObjectThenUse, farObjectCandidate, the pending use...) out of the source text and runs
// that text as it is, with the real tap-pick.js and interaction-reach.js and stubs only for the
// engine edges (reach, rooms, movement, the menu). A change to the handler is a change here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as tapPick from '../../public/break_escape/js/systems/tap-pick.js';
import * as reachMod from '../../public/break_escape/js/systems/interaction-reach.js';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const src = readFileSync(join(js, 'core/game.js'), 'utf8');

// ── cutting code out of game.js ──
// The index just past the brace that closes the block opening at `open` (skips strings,
// template literals, comments and regex literals)
function blockEnd(text, open) {
    let depth = 0;
    const tmpl = [];                       // brace depth at which each open template's ${ began
    for (let i = open; i < text.length; i++) {
        const c = text[i], n = text[i + 1];
        if (c === '/' && n === '/') { i = text.indexOf('\n', i); continue; }
        if (c === '/' && n === '*') { i = text.indexOf('*/', i) + 1; continue; }
        if (c === '"' || c === "'") {
            for (i++; text[i] !== c; i++) if (text[i] === '\\') i++;
            continue;
        }
        if (c === '`' || (c === '}' && tmpl.length && tmpl[tmpl.length - 1] === depth)) {
            if (c === '}') tmpl.pop();
            for (i++; i < text.length; i++) {
                if (text[i] === '\\') { i++; continue; }
                if (text[i] === '`') break;
                if (text[i] === '$' && text[i + 1] === '{') { tmpl.push(depth); i++; break; }
            }
            continue;
        }
        if (c === '/') {
            let j = i - 1;
            while (j >= 0 && /\s/.test(text[j])) j--;
            if ('(,=:[!&|?{};'.includes(text[j])) {
                for (i++; text[i] !== '/'; i++) {
                    if (text[i] === '\\') i++;
                    else if (text[i] === '[') { while (text[++i] !== ']') if (text[i] === '\\') i++; }
                }
                continue;
            }
        }
        if (c === '{') depth++;
        if (c === '}') { depth--; if (depth === 0) return i + 1; }
    }
    throw new Error('unbalanced block');
}
function fnSource(name) {
    const at = src.indexOf(`\nfunction ${name}(`);
    assert.ok(at >= 0, `game.js has function ${name}`);
    return src.slice(at + 1, blockEnd(src, src.indexOf('{', src.indexOf(')', at))));
}
function stmtSource(start) {
    const at = src.indexOf(start);
    assert.ok(at >= 0, `game.js has ${start}`);
    const end = blockEnd(src, src.indexOf('{', at));
    return src.slice(at, src.indexOf(';', end) + 1);
}
const HANDLER_START = "this.input.on('pointerdown', (pointer) => {";
function handlerSource() {
    const at = src.indexOf(HANDLER_START);
    assert.ok(at >= 0, 'game.js has the scene pointerdown handler');
    const arrow = at + "this.input.on('pointerdown', ".length;
    return src.slice(arrow, blockEnd(src, src.indexOf('{', arrow)));
}

const HELPERS = ['findObjectsAtPosition', 'interactionIconsBase', 'openHandIcon', 'jabHandIcon', 'talkIcon',
    'gatherInteractablesNearClick', 'useObjectInReach', 'tapAlphaAt', 'walkToObjectThenUse',
    'farObjectCandidate', 'findNPCAtPosition', 'findDoorAtPosition'];
const STUBS = ['window', 'document', 'Phaser', 'player', 'playerIsMoving', 'pendingGateWalk', 'doorGates',
    'isObjectInInteractionRange', 'sameRoomFrom', 'playerFeet', 'wallClearFrom', 'findClearStandPoint',
    'movePlayerToPoint', 'facePlayerToward', 'startHoldWalk', 'showInteractionMenu', 'isInteractionMenuOpen',
    'closeInteractionMenu', 'resolveObjectField', 'TILE_SIZE', 'SPRITE_PADDING_BOTTOM_ATLAS',
    'SPRITE_PADDING_BOTTOM_LEGACY', 'DOOR_INTERACTION_RANGE', 'INTERACTION_RANGE'];
const IMPORTS = { ...tapPick, ...reachMod };
const IMPORT_NAMES = ['tapPickList', 'farUnderTap', 'npcYieldsToObject', 'opaqueAt', 'objectStandPoint',
    'createPendingTapUse', 'aimX', 'withoutChairsIfOthers', 'takeablesBeforeChairs', 'npcGivesWay', 'objectIdOf',
    'withoutLeavingNpcsIfObjects'];
const body = [
    ...HELPERS.map(fnSource),
    stmtSource('const pendingTapUse = createPendingTapUse({'),
    `const handler = ${handlerSource()};`,
    'return { handler, pendingTapUse };'
].join('\n\n');
const factory = new Function('deps', `const { ${[...STUBS, ...IMPORT_NAMES].join(', ')} } = deps;\n${body}`);

// ── a world of plain sprites ──
const RANGE = 32;
// A sprite with Phaser-like bounds; `shape` (local frame pixels -> opaque) stands in for its texture
function sprite(id, x, y, w, h, extra = {}) {
    const ox = extra.originX ?? 0, oy = extra.originY ?? 0;
    return {
        id, x, y, width: w, height: h, originX: ox, originY: oy, active: true, visible: true,
        interactable: true, depth: extra.depth ?? 0, scenarioData: { id, name: id, ...(extra.data || {}) },
        texture: { key: id }, frame: { name: 0, realWidth: w, realHeight: h },
        getBounds() { const left = x - ox * w, top = y - oy * h; return { left, top, right: left + w, bottom: top + h }; },
        ...extra
    };
}
// An NPC: 80x80 frame, origin 0.5, figure a 20x40 box in the middle
function npc(id, x, y, extra = {}) {
    return sprite(id, x, y, 80, 80, { originX: 0.5, originY: 0.5, _isNPC: true, npcId: id,
        shape: (lx, ly) => lx >= 30 && lx < 50 && ly >= 22 && ly < 62, ...extra });
}

function world({ player, objects = [], npcs = [], hostile = [], roomOf = () => 'r1', confirmOpen = false, inUse = {} }) {
    const log = [];
    const sprites = new Map([...objects, ...npcs].map(s => [s.id, s]));
    const state = { menuOpen: false, moving: false };
    const win = {
        player, currentPlayerRoom: roomOf(player),
        rooms: { r1: { objects: Object.fromEntries(objects.map(o => [o.id, o])), npcSprites: npcs, doorSprites: [] } },
        npcHostileSystem: { isNPCKO: () => false, isNPCHostile: (id) => hostile.includes(id) },
        npcManager: { getNPC: (id) => ({ displayName: id }) },
        handleObjectInteraction: (o) => log.push(`use:${o.id}`),
        tryInteractWithNPC: (s) => log.push(`talk:${s.id}`),
        seating: { isSeat: (o) => !!o.seat, queueSit: (o) => log.push(`sit:${o.id}`) },
        pcInUseBy: (o) => inUse[o.id] || null,
        showPcInUse: (o) => log.push(`inuse:${o.id}`),
        MinigameFramework: { currentMinigame: null },
        pathfindingManager: null
    };
    const deps = {
        ...IMPORTS,
        window: win,
        document: { querySelector: (sel) => (confirmOpen && sel === '.game-confirm-overlay' ? {} : null) },
        Phaser: { Math: { Distance: { Between: (a, b, c, d) => Math.hypot(c - a, d - b) } } },
        player,
        get playerIsMoving() { return state.moving; },
        pendingGateWalk: { clear() {}, arm() {} },
        doorGates: { walkThroughTarget: () => null },
        isObjectInInteractionRange: (s) => Math.hypot(s.x - player.x, s.y - player.y) <= RANGE,
        sameRoomFrom: (from, t) => roomOf(from) === roomOf(t),
        playerFeet: (p) => ({ x: p.x, y: p.y, room: p.room }),
        wallClearFrom: () => true,
        findClearStandPoint: () => null,
        movePlayerToPoint: (x, y) => { log.push(`walk:${Math.round(x)},${Math.round(y)}`); state.moving = true; },
        facePlayerToward: () => {},
        startHoldWalk: () => {},
        showInteractionMenu: (list) => { state.lastMenu = list; log.push(`menu:${list.map(c => (c.far ? `far ${c.label}` : c.label)).join('|')}`); state.menuOpen = true; },
        isInteractionMenuOpen: () => state.menuOpen,
        closeInteractionMenu: () => { state.menuOpen = false; },
        resolveObjectField: (data, f, fb) => data?.[f] ?? fb,
        TILE_SIZE: 32, SPRITE_PADDING_BOTTOM_ATLAS: 0, SPRITE_PADDING_BOTTOM_LEGACY: 0,
        DOOR_INTERACTION_RANGE: 64, INTERACTION_RANGE: RANGE
    };
    const scene = {
        cameras: { main: { scrollX: 0, scrollY: 0 } },
        textures: { getPixelAlpha: (x, y, key) => (sprites.get(key)?.shape ? (sprites.get(key).shape(x, y) ? 255 : 0) : 255) }
    };
    const { handler, pendingTapUse } = factory.call(scene, deps);
    const tap = (x, y) => handler.call(scene, { x, y, rightButtonDown: () => false, event: {} });
    return { tap, log, state, pendingTapUse, win };
}
const walkedTo = (log) => log.some(l => l.startsWith('walk:'));

// ── M1: an in-reach NPC over a far object ──
test('handler M1: a tap on Sarah\'s figure over the far directory talks to her, no menu', () => {
    const player = { x: 126, y: 71 };
    const sarah = npc('sarah', 150, 60, { depth: 80 });
    const directory = sprite('directory', 150, 20, 40, 40, { depth: 10 });
    const w = world({ player, objects: [directory], npcs: [sarah] });
    w.tap(150, 45);                              // her head, inside the far directory's bounds
    assert.deepEqual(w.log, ['talk:sarah']);
});

test('handler M1: a tap on the empty part of her frame over the far object walks to the object', () => {
    const player = { x: 126, y: 71 };
    const sarah = npc('sarah', 150, 60, { depth: 80 });
    const directory = sprite('directory', 165, 20, 40, 40, { depth: 10 });
    const w = world({ player, objects: [directory], npcs: [sarah] });
    w.tap(180, 30);                              // in her frame, off her figure, on the directory
    assert.ok(!w.log.some(l => l.startsWith('menu') || l.startsWith('talk')), w.log.join());
    assert.ok(walkedTo(w.log));
    assert.equal(w.pendingTapUse.get()?.obj, directory, 'the directory is used on arrival');
});

test('handler M1: an in-reach hostile over a far object is struck, no menu', () => {
    const player = { x: 126, y: 71 };
    const thug = npc('thug', 150, 60, { depth: 80 });
    const pc = sprite('pc', 165, 20, 40, 40, { depth: 10 });
    const w = world({ player, objects: [pc], npcs: [thug], hostile: ['thug'] });
    w.tap(180, 30);                              // even off his figure
    assert.deepEqual(w.log, ['talk:thug']);      // tryInteractWithNPC jabs a hostile
    const w2 = world({ player, objects: [pc], npcs: [thug], hostile: ['thug'] });
    w2.tap(150, 45);
    assert.deepEqual(w2.log, ['talk:thug']);
});

test('handler: in-reach item and far item both under the tap still give the menu with a walk entry', () => {
    const player = { x: 100, y: 100 };
    const coffee = sprite('coffee', 110, 110, 20, 20, { depth: 50 });
    const desk_pc = sprite('desk_pc', 125, 125, 40, 40, { depth: 40 });   // 35 px away: out of reach
    const w = world({ player, objects: [coffee, desk_pc] });
    w.tap(128, 128);
    assert.deepEqual(w.log, ['menu:coffee|far desk_pc']);
});

// ── M2: the far PC of a seated owner ──
test('handler M2: a tap on a far PC someone is using says so and does not walk', () => {
    const player = { x: 50, y: 50 };
    const pc = sprite('omar_pc', 104, 96, 32, 24, { data: { lockType: 'login' } });
    const w = world({ player, objects: [pc], inUse: { omar_pc: 'omar' } });
    w.tap(120, 108);
    assert.deepEqual(w.log, ['inuse:omar_pc']);
    assert.equal(w.pendingTapUse.get(), null);
});

// ── m1: far objects of another room ──
test('handler m1: a far object in another room is walked to but not used on arrival', () => {
    const player = { x: 50, y: 150, room: 'south' };
    const fixture = sprite('north_board', 40, 60, 30, 20, { room: 'north' });
    const roomOf = (t) => t.room || 'south';
    const w = world({ player, objects: [fixture], roomOf });
    w.tap(55, 70);
    assert.ok(walkedTo(w.log));
    assert.equal(w.pendingTapUse.get(), null);
});

// ── m2: a far NPC of another room ──
test('handler m2: a far NPC of another room does not take the tap from an in-reach item', () => {
    const player = { x: 100, y: 150, room: 'south', };
    const north = npc('north_npc', 100, 85, { room: 'north' });
    const fixture = sprite('switch', 105, 125, 10, 10, { room: 'south' });   // 26 px away: in reach
    const roomOf = (t) => t.room || 'south';
    const w = world({ player, objects: [fixture], npcs: [north], roomOf });
    w.tap(100, 105);                             // on north's figure, beside the switch (slop)
    assert.deepEqual(w.log, ['use:switch']);
});

// ── m3: an object drawn over an NPC ──
test('handler m3: a far object drawn over a far NPC takes the tap and is used on arrival', () => {
    const player = { x: 150, y: 200 };
    const sarah = npc('sarah', 128, 41, { depth: 81 });
    const log_ = sprite('signin_log', 120, 50, 20, 16, { depth: 90 });
    const w = world({ player, objects: [log_], npcs: [sarah] });
    w.tap(128, 55);                              // on the log and on her figure
    assert.ok(walkedTo(w.log) && !w.log.some(l => l.startsWith('talk')));
    assert.equal(w.pendingTapUse.get()?.obj, log_);
});

test('handler m3: an object drawn under the NPC\'s figure leaves the tap to her', () => {
    const player = { x: 150, y: 200 };
    const sarah = npc('sarah', 128, 41, { depth: 81 });
    const board = sprite('board', 110, 20, 40, 40, { depth: 10 });
    const w = world({ player, objects: [board], npcs: [sarah] });
    w.tap(128, 40);
    assert.ok(walkedTo(w.log));
    assert.equal(w.pendingTapUse.get(), null, 'walked to Sarah, nothing armed');
});

// ── the menu entry arms the pending use ──
test('handler: choosing the far entry from the menu walks and arms the use', () => {
    const player = { x: 100, y: 100 };
    const coffee = sprite('coffee', 110, 110, 20, 20, { depth: 50 });
    const desk_pc = sprite('desk_pc', 125, 125, 40, 40, { depth: 40 });
    const w = world({ player, objects: [coffee, desk_pc] });
    w.tap(128, 128);
    const far = w.state.lastMenu.find(c => c.far);
    assert.match(far.detail, /^Walk over and use it/);
    far.onSelect();
    assert.ok(walkedTo(w.log));
    assert.equal(w.pendingTapUse.get()?.obj, desk_pc);
});

// ── m4: a menu or confirm on the way drops the use ──
test('handler m4: a confirm dialog or the pick-one menu opening on the way drops the use', () => {
    const player = { x: 50, y: 50 };
    const note = sprite('note', 120, 100, 10, 10);
    const w = world({ player, objects: [note], confirmOpen: true });
    w.tap(125, 105);
    assert.equal(w.pendingTapUse.get()?.obj, note);
    w.pendingTapUse.update(Date.now());
    assert.equal(w.pendingTapUse.get(), null);
    const w2 = world({ player, objects: [note] });
    w2.tap(125, 105);
    w2.state.menuOpen = true;
    w2.pendingTapUse.update(Date.now());
    assert.equal(w2.pendingTapUse.get(), null);
});

// ── the cases the branch was built for, through the real handler ──
test('handler U3: a tap on Kim\'s stick from out of reach walks to it, not the in-reach phone', () => {
    const player = { x: 150, y: 100 };
    const stick = sprite('kim_usb', 168, 129, 13, 8);       // 34 px: out of reach
    const phone = sprite('kim_phone', 152, 129, 12, 21);    // 29 px: in reach, within slop of the tap
    const w = world({ player, objects: [stick, phone] });
    w.tap(174.5, 133);
    assert.ok(walkedTo(w.log) && !w.log.includes('use:kim_phone'), w.log.join());
    assert.equal(w.pendingTapUse.get()?.obj, stick);
    const w2 = world({ player, objects: [stick, phone] });
    w2.tap(158, 140);
    assert.deepEqual(w2.log, ['use:kim_phone']);
});

test('handler finding 6: seated owner in reach, PC out of reach: his figure talks, the PC through his frame is walked to', () => {
    const player = { x: 128, y: 130 };
    const omar = npc('omar', 120, 104, { depth: 60 });       // figure x 110-130, y 86-126
    const pc = sprite('omar_pc', 140, 92, 32, 24, { depth: 50 });
    const w = world({ player, objects: [pc], npcs: [omar] });
    w.tap(125, 95);                                          // his figure (not on the PC)
    assert.deepEqual(w.log, ['talk:omar']);
    const w2 = world({ player, objects: [pc], npcs: [omar] });
    w2.tap(150, 100);                                        // the PC, inside his frame, off his figure
    assert.ok(walkedTo(w2.log) && !w2.log.some(l => l.startsWith('talk') || l.startsWith('menu')), w2.log.join());
    assert.equal(w2.pendingTapUse.get()?.obj, pc);
});

test('handler finding 6: a seated owner at his PC: the PC tap says he is using it, no walk into him', () => {
    const player = { x: 128, y: 130 };
    const omar = npc('omar', 120, 104, { depth: 60 });
    const pc = sprite('omar_pc', 140, 92, 32, 24, { depth: 50, data: { lockType: 'login' } });
    const w = world({ player, objects: [pc], npcs: [omar], inUse: { omar_pc: 'omar' } });
    w.tap(150, 100);
    assert.deepEqual(w.log, ['inuse:omar_pc']);
});

test('handler: both in reach under the tap keeps the menu', () => {
    const player = { x: 125, y: 100 };
    const omar = npc('omar', 120, 104, { depth: 60 });
    const pc = sprite('omar_pc', 112, 92, 32, 24, { depth: 50 });
    const w = world({ player, objects: [pc], npcs: [omar] });
    w.tap(120, 100);
    assert.deepEqual(w.log, ['menu:omar_pc|omar']);
});
