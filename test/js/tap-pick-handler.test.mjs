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
    'farObjectCandidate', 'findNPCAtPosition', 'findDoorAtPosition', 'allNpcSprites', 'npcBesidePlayer'];
const STUBS = ['window', 'document', 'Phaser', 'player', 'playerIsMoving', 'pendingGateWalk', 'doorGates',
    'isObjectInInteractionRange', 'sameRoomFrom', 'playerFeet', 'wallClearFrom', 'findClearStandPoint',
    'movePlayerToPoint', 'facePlayerToward', 'startHoldWalk', 'showInteractionMenu', 'isInteractionMenuOpen',
    'closeInteractionMenu', 'resolveObjectField', 'TILE_SIZE', 'SPRITE_PADDING_BOTTOM_ATLAS',
    'SPRITE_PADDING_BOTTOM_LEGACY', 'DOOR_INTERACTION_RANGE', 'INTERACTION_RANGE'];
const IMPORTS = { ...tapPick, ...reachMod };
const IMPORT_NAMES = ['tapPickList', 'farUnderTap', 'npcYieldsToObject', 'npcYieldTarget', 'opaqueAt', 'opaqueNear', 'objectStandPoint',
    'createPendingTapUse', 'aimX', 'withoutChairsIfOthers', 'takeablesBeforeChairs', 'npcGivesWay', 'objectIdOf',
    'withoutLeavingNpcsIfObjects'];
const body = [
    ...HELPERS.map(fnSource),
    stmtSource('const pendingTapUse = createPendingTapUse({'),
    `const handler = ${handlerSource()};`,
    'return { handler, pendingTapUse };'
].join('\n\n');
// playerIsMoving is a live binding in game.js (imported from player.js); a destructured stub
// would freeze it at false, so the cut text reads it from deps each time
const LIVE = ['playerIsMoving'];
const liveBody = LIVE.reduce((t, n) => t.replace(new RegExp(`\\b${n}\\b`, 'g'), `deps.${n}`), body);
const factory = new Function('deps', `const { ${[...STUBS.filter(n => !LIVE.includes(n)), ...IMPORT_NAMES].join(', ')} } = deps;\n${liveBody}`);

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
        gameAlert: (m) => log.push(`alert:${m}`),
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

// ── code review R2 ──
test('handler R2 M2: a tap on a far memo drawn over an in-reach NPC\'s figure is the memo\'s', () => {
    const player = { x: 126, y: 71 };
    const sarah = npc('sarah', 150, 60, { depth: 80 });
    const memo = sprite('memo', 159, 60, 12, 10, { depth: 95 });   // 34.8 px away: out of reach
    const w = world({ player, objects: [memo], npcs: [sarah] });
    w.tap(159.5, 65);                            // on the memo, with her figure behind it
    assert.ok(!w.log.some(l => l.startsWith('talk') || l.startsWith('menu')), w.log.join());
    assert.ok(walkedTo(w.log));
    assert.equal(w.pendingTapUse.get()?.obj, memo, 'the memo is used on arrival');
});

test('handler R2 M2: a seated owner in reach, his far monitor drawn in front of him: the tap says he is using it', () => {
    const player = { x: 128, y: 130 };
    const omar = npc('omar', 120, 104, { depth: 60 });                   // figure x 110-130, y 86-126
    const pc = sprite('omar_pc', 126, 96, 20, 16, { depth: 70, data: { lockType: 'login' } });   // 34 px: far
    const w = world({ player, objects: [pc], npcs: [omar], inUse: { omar_pc: 'omar' } });
    w.tap(128, 100);                             // on the monitor, over his figure
    assert.deepEqual(w.log, ['inuse:omar_pc']);
});

test('handler R2 m1: both in reach, a tap on the log drawn over her opens the log, no menu', () => {
    const player = { x: 140, y: 80 };
    const sarah = npc('sarah', 150, 60, { depth: 80 });
    const log_ = sprite('signin_log', 145, 62, 12, 8, { depth: 95 });    // in reach, over her figure
    const w = world({ player, objects: [log_], npcs: [sarah] });
    w.tap(150, 65);
    assert.deepEqual(w.log, ['use:signin_log']);
    const w2 = world({ player, objects: [log_], npcs: [sarah] });
    w2.tap(150, 58);                             // her uncovered figure, within the log's slop
    assert.deepEqual(w2.log, ['menu:signin_log|sarah']);
});

test('handler R2 m1: a tap on a memo\'s pixels beside an in-reach NPC opens the memo', () => {
    const player = { x: 140, y: 80 };
    const sarah = npc('sarah', 150, 60, { depth: 80 });
    const memo = sprite('memo', 162, 70, 10, 8, { depth: 50 });          // beside her figure (x 140-160)
    const w = world({ player, objects: [memo], npcs: [sarah] });
    w.tap(165, 73);                              // on the memo, in her frame, off her figure
    assert.deepEqual(w.log, ['use:memo']);
});

test('handler R2 m3: the menu entry for a far PC in use names who is using it', () => {
    const player = { x: 100, y: 100 };
    const coffee = sprite('coffee', 110, 110, 20, 20, { depth: 50 });
    const desk_pc = sprite('desk_pc', 125, 125, 40, 40, { depth: 40, data: { lockType: 'login', observations: 'A desktop PC.' } });
    const w = world({ player, objects: [coffee, desk_pc], inUse: { desk_pc: 'omar' } });
    w.tap(128, 128);
    const far = w.state.lastMenu.find(c => c.far);
    assert.equal(far.detail, 'omar is using it. A desktop PC.');
    far.onSelect();
    assert.deepEqual(w.log.slice(1), ['inuse:desk_pc'], 'picking it explains and does not walk');
});

test('handler R2 m5: a tap a pixel off an in-reach NPC\'s outline, over a far object behind her, talks to her', () => {
    const player = { x: 126, y: 71 };
    const sarah = npc('sarah', 150, 60, { depth: 80 });                 // figure x 140-160, y 42-82
    const board = sprite('board', 155, 20, 40, 40, { depth: 10 });      // far, drawn behind her
    const w = world({ player, objects: [board], npcs: [sarah] });
    w.tap(161, 50);
    assert.deepEqual(w.log, ['talk:sarah']);
    const w2 = world({ player, objects: [board], npcs: [sarah] });
    w2.tap(165, 50);                             // 5 px off: the board's
    assert.ok(walkedTo(w2.log) && !w2.log.some(l => l.startsWith('talk')), w2.log.join());
    assert.equal(w2.pendingTapUse.get()?.obj, board);
});

test('handler R2 M1: a keyboard walk after a far tap never uses the object', () => {
    const player = { x: 50, y: 50 };
    const note = sprite('note', 120, 100, 10, 10);
    const w = world({ player, objects: [note] });
    w.tap(125, 105);
    assert.equal(w.pendingTapUse.get()?.obj, note);
    const t0 = Date.now();
    w.state.moving = false;                      // the keys cancel click-to-move
    for (let i = 1; i <= 10; i++) { player.y += 2; w.pendingTapUse.update(t0 + i * 100); }
    player.x = 110; player.y = 95;               // walked into reach with the keys
    w.pendingTapUse.update(t0 + 1100);
    assert.ok(!w.log.includes('use:note'), w.log.join());
    assert.equal(w.pendingTapUse.get(), null);
});

test('handler R2 m4: a blocked walk drops the use with a short message', () => {
    const player = { x: 50, y: 50 };
    const note = sprite('note', 120, 100, 10, 10);
    const w = world({ player, objects: [note] });
    w.tap(125, 105);
    const t0 = Date.now();
    w.pendingTapUse.update(t0 + 1500);           // on a path, feet still
    assert.equal(w.pendingTapUse.get(), null);
    assert.ok(w.log.includes("alert:Something's in the way."), w.log.join());
    const guard = npc('guard', 60, 60);
    const w2 = world({ player, objects: [note], npcs: [guard] });
    w2.tap(125, 105);
    w2.pendingTapUse.update(Date.now() + 1500);
    assert.ok(w2.log.includes("alert:Someone's in the way."), w2.log.join());
});

test('handler R3 m1: a walk that ends out of reach says so once', () => {
    const player = { x: 50, y: 50 };
    const note = sprite('note', 120, 100, 10, 10);
    const w = world({ player, objects: [note] });
    w.tap(125, 105);
    const t0 = Date.now();
    w.state.moving = false;                      // the walk ended, still out of reach
    w.pendingTapUse.update(t0 + 500);
    w.pendingTapUse.update(t0 + 600);
    assert.equal(w.pendingTapUse.get(), null);
    assert.deepEqual(w.log.filter(l => l.startsWith('alert:')), ["alert:Can't reach it from here."]);
});

test('handler R3 m2: knocked out or frozen on the way, the use drops with no message', () => {
    const note = sprite('note', 120, 100, 10, 10);
    for (const stop of ['ko', 'frozen']) {
        const player = { x: 50, y: 50 };
        const guard = npc('guard', 60, 60);
        const w = world({ player, objects: [note], npcs: [guard] });
        w.tap(125, 105);
        assert.equal(w.pendingTapUse.get()?.obj, note);
        if (stop === 'ko') w.win.playerHealth = { isKO: () => true };
        else player.disableMovement = true;
        const t0 = Date.now();
        w.pendingTapUse.update(t0 + 1500);       // on a path, feet still: would be "blocked"
        w.state.moving = false;
        w.pendingTapUse.update(t0 + 2000);       // or stopped short
        assert.equal(w.pendingTapUse.get(), null, stop);
        assert.ok(!w.log.some(l => l.startsWith('alert:')), `${stop}: ${w.log.join()}`);
    }
});

test('handler R3 n2: a knocked-out body beside the player is not "someone" in the way', () => {
    const player = { x: 50, y: 50 };
    const note = sprite('note', 120, 100, 10, 10);
    const guard = npc('guard', 60, 60);
    const w = world({ player, objects: [note], npcs: [guard] });
    w.win.npcHostileSystem.isNPCKO = (id) => id === 'guard';
    w.tap(125, 105);
    w.pendingTapUse.update(Date.now() + 1500);
    assert.ok(w.log.includes("alert:Something's in the way."), w.log.join());
});

// ── R2 n3: every free name in the cut source is a stub, an import or a known global ──
// The cutter runs the handler as text, so a name it uses that the harness does not pass in
// would only fail in a branch a test reaches. This lists the free names statically.
function codeOnly(text) {
    let out = '';
    const tmpl = [];
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
        const c = text[i], n = text[i + 1];
        if (c === '/' && n === '/') { const e = text.indexOf('\n', i); out += ' '.repeat(e - i); i = e - 1; continue; }
        if (c === '/' && n === '*') { const e = text.indexOf('*/', i) + 2; out += ' '.repeat(e - i); i = e - 1; continue; }
        if (c === '"' || c === "'") {
            let j = i + 1; for (; text[j] !== c; j++) if (text[j] === '\\') j++;
            out += ' '.repeat(j - i + 1); i = j; continue;
        }
        if (c === '`' || (c === '}' && tmpl.length && tmpl[tmpl.length - 1] === depth)) {
            if (c === '}') tmpl.pop();
            let j = i + 1;
            for (; j < text.length; j++) {
                if (text[j] === '\\') { j++; continue; }
                if (text[j] === '`') break;
                if (text[j] === '$' && text[j + 1] === '{') { tmpl.push(depth); j++; break; }
            }
            out += ' '.repeat(j - i + 1); i = j; continue;
        }
        if (c === '/') {
            let j = out.length - 1;
            while (j >= 0 && /\s/.test(out[j])) j--;
            const before = out.slice(0, j + 1);
            if ('(,=:[!&|?{};'.includes(out[j]) || /\b(return|typeof|case)$/.test(before)) {
                let k = i + 1;
                for (; text[k] !== '/'; k++) {
                    if (text[k] === '\\') k++;
                    else if (text[k] === '[') { while (text[++k] !== ']') if (text[k] === '\\') k++; }
                }
                while (/[a-z]/.test(text[k + 1])) k++;
                out += ' '.repeat(k - i + 1); i = k; continue;
            }
        }
        if (c === '{') depth++;
        if (c === '}') depth--;
        out += c;
    }
    return out;
}
const KEYWORDS = new Set(('if else return const let var function new typeof of in for while do true false null undefined this '
    + 'try catch finally throw break continue instanceof void delete async await default switch case get set').split(' '));
const GLOBALS = new Set(('Math Object Array Number String Boolean Date JSON Infinity NaN console Set Map WeakMap Error '
    + 'isNaN isFinite parseInt parseFloat Promise setTimeout clearTimeout Symbol RegExp arguments').split(' '));
// Block ranges of the blanked code: [open, close] index pairs of matching braces
function blocks(code) {
    const pairs = [], stack = [];
    for (let i = 0; i < code.length; i++) {
        if (code[i] === '{') stack.push(i);
        else if (code[i] === '}') pairs.push([stack.pop(), i]);
    }
    return pairs;
}
// Free names, scope-aware (code review R3 n1): each declaration counts only inside the range it
// lives in, so `const player = ...` in one helper does not cover a use in another.
// const/let/var and function names: the innermost block holding them. Parameters and catch
// names: the function's or catch's block (an arrow with an expression body: from the arrow to
// the end of its enclosing block, a slight over-reach). A for-head's const: the rest of the
// enclosing block, also a slight over-reach. var is treated like let, which is stricter.
function freeNames(code) {
    const pairs = blocks(code);
    const enclosing = (pos) => {
        let best = [0, code.length];
        for (const [o, c] of pairs) if (o < pos && pos < c && o >= best[0]) best = [o, c];
        return best;
    };
    const blockAt = (open) => pairs.find(([o]) => o === open);
    const nextNonSpace = (i) => { while (i < code.length && /\s/.test(code[i])) i++; return i; };
    const decls = [];                       // [name, from, to]
    const declare = (name, [from, to]) => decls.push([name, from, to]);
    const ident = /[A-Za-z_$][\w$]*/g;
    const namesIn = (str) => (str.match(ident) || []);
    for (const m of code.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) declare(m[1], enclosing(m.index));
    for (const m of code.matchAll(/\b(?:const|let|var)\s+([\w$]+(?:\s*,\s*[\w$]+)+)\s*;/g)) {
        namesIn(m[1]).forEach(n => declare(n, enclosing(m.index)));
    }
    for (const m of code.matchAll(/\b(?:const|let|var)\s*([{[])/g)) {
        const open = m.index + m[0].length - 1;
        const close = code.indexOf(m[1] === '{' ? '}' : ']', open);
        namesIn(code.slice(open, close)).forEach(n => declare(n, enclosing(m.index)));
    }
    // The block that follows a `)` or `=>` at index `paren` (a function or catch body), else the
    // rest of the enclosing block
    // (from `from`, so the parameter list itself counts as inside)
    const bodyAfter = (paren, from) => {
        const b = nextNonSpace(paren + 1);
        const pair = code[b] === '{' ? blockAt(b) : null;
        return [from, pair ? pair[1] : enclosing(from)[1]];
    };
    for (const m of code.matchAll(/\bfunction\s*([A-Za-z_$][\w$]*)?\s*\(([^)]*)\)/g)) {
        if (m[1]) declare(m[1], enclosing(m.index));
        const scope = bodyAfter(m.index + m[0].length - 1, m.index);
        namesIn(m[2]).forEach(n => declare(n, scope));
    }
    for (const m of code.matchAll(/\bcatch\s*\(\s*([A-Za-z_$][\w$]*)\s*\)/g)) {
        declare(m[1], bodyAfter(m.index + m[0].length - 1, m.index));
    }
    for (const m of code.matchAll(/([A-Za-z_$][\w$]*)\s*=>/g)) {
        declare(m[1], bodyAfter(m.index + m[0].length - 1, m.index));
    }
    for (const m of code.matchAll(/\)\s*=>/g)) {
        let d = 0, k = m.index;
        for (; k >= 0; k--) { if (code[k] === ')') d++; else if (code[k] === '(' && --d === 0) break; }
        const scope = bodyAfter(m.index + m[0].length - 1, k);
        namesIn(code.slice(k, m.index)).forEach(n => declare(n, scope));
    }
    const declaredAt = (name, pos) => decls.some(([n, from, to]) => n === name && from <= pos && pos <= to);
    const free = new Set();
    for (const m of code.matchAll(ident)) {
        const name = m[0];
        if (/\d/.test(name[0])) continue;
        let b = m.index - 1;
        while (b >= 0 && /\s/.test(code[b])) b--;
        if (code[b] === '.' && code.slice(b - 2, b + 1) !== '...') continue;   // a property
        let a = m.index + name.length;
        while (a < code.length && /\s/.test(code[a])) a++;
        if (code[a] === ':' && (code[b] === '{' || code[b] === ',')) continue; // an object key
        if (KEYWORDS.has(name) || GLOBALS.has(name) || declaredAt(name, m.index)) continue;
        free.add(name);
    }
    return free;
}

test('handler R2 n3: every free name in the cut source is passed in by the harness', () => {
    const allowed = new Set([...STUBS, ...IMPORT_NAMES, 'deps']);
    const missing = [...freeNames(codeOnly(body))].filter(n => !allowed.has(n));
    assert.deepEqual(missing, [], `free names the harness does not stub: ${missing.join(', ')}`);
});

test('handler R2 n3: the free-name check finds a name no stub covers', () => {
    const free = freeNames(codeOnly("function f(a) { const b = a.x; if (b) return /x/.test(c) ? notStubbed(b) : `${a}`; }"));
    assert.deepEqual([...free], ['c', 'notStubbed']);
});

test('handler R3 n1: the free-name check is scope-aware', () => {
    // p is declared in f only; the use in g is free. The arrow's x and the catch's e stay local.
    const free = freeNames(codeOnly('function f() { const p = 1; return [1].map(x => x + p); } '
        + 'function g() { try { return p; } catch (e) { return e; } } const h = (y) => { return x + y; };'));
    assert.deepEqual([...free].sort(), ['p', 'x']);
});

test('handler R3 n1: the cut source uses player free, so dropping its stub would be caught', () => {
    // A name that is also a local in one helper (const player = window.player) must still show
    // as free where it is used outside that helper (the far-NPC branch)
    assert.ok(freeNames(codeOnly(body)).has('player'), 'player is a free name of the cut source');
    const allowed = new Set([...STUBS.filter(n => n !== 'player'), ...IMPORT_NAMES, 'deps']);
    const missing = [...freeNames(codeOnly(body))].filter(n => !allowed.has(n));
    assert.deepEqual(missing, ['player']);
});
