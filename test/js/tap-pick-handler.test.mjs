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
import { worldObservations } from '../../public/break_escape/js/utils/pc-observations.js';
// The menu icons live in ui/interaction-menu.js (shared with the action menu); it sets
// window globals as it loads, so a bare window must exist first
globalThis.window ??= {};
const menuIcons = await import('../../public/break_escape/js/ui/interaction-menu.js');

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

const HELPERS = ['findObjectsAtPosition',
    'gatherInteractablesNearClick', 'useObjectInReach', 'tapAlphaAt', 'walkToObjectThenUse',
    'findNPCsAtPosition', 'findNPCAtPosition', 'findDoorAtPosition', 'allNpcSprites', 'npcBesidePlayer',
    'standPointDeps', 'isSeatOrSwivel', 'hitStackKey', 'playerAtFeet', 'inReachFrom', 'inReachNow',
    'feetWithin', 'standsInsideNpc', 'stillThere', 'roomHasActiveHostile', 'walkToDoor', 'showTapMenu', 'tapWalkBlocked',
    'tapWalkStoppedShort', 'tapWalkBusy', 'menuEntryState', 'overlapRetryNext', 'clearOverlapWalk', 'walkTowardNpc', 'overlapStoppedShort', 'overlapReachSpan', 'lineClearFromFeet', 'tappedScreenBox'];
const STUBS = ['window', 'document', 'Phaser', 'player', 'playerIsMoving', 'pendingGateWalk', 'doorGates',
    'isObjectInInteractionRange', 'sameRoomFrom', 'playerFeet', 'wallClearFrom', 'findClearStandPoint',
    'movePlayerToPoint', 'facePlayerToward', 'startHoldWalk', 'showInteractionMenu', 'isInteractionMenuOpen',
    'closeInteractionMenu', 'resolveObjectField', 'worldObservations', 'TILE_SIZE', 'SPRITE_PADDING_BOTTOM_ATLAS',
    'SPRITE_PADDING_BOTTOM_LEGACY', 'DOOR_INTERACTION_RANGE', 'INTERACTION_RANGE', 'ARRIVAL_THRESHOLD', 'stopClickToMove',
    'menuIconsFor'];
const IMPORTS = { ...tapPick, ...reachMod, openHandIcon: menuIcons.openHandIcon, jabHandIcon: menuIcons.jabHandIcon, talkIcon: menuIcons.talkIcon };
const IMPORT_NAMES = ['tapPickList', 'farUnderTap', 'npcYieldsToObject', 'npcYieldTarget', 'opaqueAt', 'opaqueNear', 'objectStandPoint',
    'createPendingTapUse', 'aimX', 'reachX', 'reachY', 'withoutChairsIfOthers', 'takeablesBeforeChairs', 'npcGivesWay', 'objectIdOf',
    'withoutLeavingNpcsIfObjects', 'openHandIcon', 'jabHandIcon', 'talkIcon', 'pixelHits', 'soleHit', 'overlapStandPoint', 'overlapRetryTarget',
    'seatsGiveWay'];
const body = [
    ...HELPERS.map(fnSource),
    stmtSource('const pendingTapUse = createPendingTapUse({'),
    'const RETRY_GRACE_MS = 300;',
    'let overlapRetry = { stand: null, used: false };',
    stmtSource('const pendingOverlapWalk = createPendingTapUse({'),
    `const handler = ${handlerSource()};`,
    'return { handler, pendingTapUse, pendingOverlapWalk, roomHasActiveHostile, inReachFrom };'
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

function world({ player, objects = [], npcs = [], doors = [], hostile = [], ko = [], roomOf = () => 'r1', confirmOpen = false, inUse = {} }) {
    const log = [];
    const sprites = new Map([...objects, ...npcs].map(s => [s.id, s]));
    const state = { menuOpen: false, moving: false };
    const ovr = { out: new Set() };   // ids forced out of reach from where the player stands
    const win = {
        player, currentPlayerRoom: roomOf(player),
        rooms: { r1: { objects: Object.fromEntries(objects.map(o => [o.id, o])), npcSprites: npcs, doorSprites: doors } },
        npcHostileSystem: { isNPCKO: (id) => ko.includes(id), isNPCHostile: (id) => hostile.includes(id) },
        handleDoorInteraction: (d) => log.push(`door:${d.id}`),
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
        isObjectInInteractionRange: (s, from = player, range = RANGE) => !(from === player && ovr.out.has(s.id)) && Math.hypot(s.x - from.x, s.y - from.y) <= range,
        menuIconsFor: (list) => list.map(c => (c.sprite ? { src: `icon:${c.sprite.id}` } : null)),
        stopClickToMove: () => { state.stopped = (state.stopped || 0) + 1; state.moving = false; },
        ARRIVAL_THRESHOLD: 8,
        sameRoomFrom: (from, t) => roomOf(from) === roomOf(t),
        playerFeet: (p) => ({ x: p.x, y: p.y, room: p.room }),
        wallClearFrom: () => true,
        findClearStandPoint: () => null,
        movePlayerToPoint: (x, y, opts) => { log.push(`walk:${Math.round(x)},${Math.round(y)}`); state.moveOpts = opts; state.moving = true; },
        facePlayerToward: () => {},
        startHoldWalk: () => {},
        showInteractionMenu: (list, x, y, title, opts) => { state.lastMenu = list; state.menuOpts = opts; log.push(`menu:${list.map(c => (c.far ? `far ${c.label}` : c.label)).join('|')}`); state.menuOpen = true; },
        isInteractionMenuOpen: () => state.menuOpen,
        closeInteractionMenu: () => { state.menuOpen = false; },
        resolveObjectField: (data, f, fb) => data?.[f] ?? fb,
        worldObservations,
        TILE_SIZE: 32, SPRITE_PADDING_BOTTOM_ATLAS: 0, SPRITE_PADDING_BOTTOM_LEGACY: 0,
        DOOR_INTERACTION_RANGE: 64, INTERACTION_RANGE: RANGE
    };
    const scene = {
        cameras: { main: { scrollX: 0, scrollY: 0 } },
        textures: { getPixelAlpha: (x, y, key) => (sprites.get(key)?.shape ? (sprites.get(key).shape(x, y) ? 255 : 0) : 255) }
    };
    const { handler, pendingTapUse, pendingOverlapWalk, roomHasActiveHostile, inReachFrom } = factory.call(scene, deps);
    const tap = (x, y) => handler.call(scene, { x, y, rightButtonDown: () => false, event: {} });
    return { ovr, tap, log, state, pendingTapUse, pendingOverlapWalk, roomHasActiveHostile, inReachFrom, win, deps };
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

test('handler: in-reach item and far item both under the tap: the in-reach one acts at once (overlap plan D1 rule 2)', () => {
    const player = { x: 100, y: 100 };
    const coffee = sprite('coffee', 110, 110, 20, 20, { depth: 50 });
    const desk_pc = sprite('desk_pc', 125, 125, 40, 40, { depth: 40 });   // 35 px away: out of reach
    const w = world({ player, objects: [coffee, desk_pc] });
    w.tap(128, 128);
    assert.deepEqual(w.log, ['use:coffee']);
});

// ── UI PC polish 1: the menu line for a PC is its lock, and only while it is locked ──
test('handler: a PC\'s observations show in the menu while it is locked and go once it is unlocked; a note keeps its own', () => {
    const player = { x: 100, y: 100 };
    const mk = (locked) => [
        sprite('derek_pc', 108, 108, 24, 24, { depth: 40, data: { type: 'pc', lockType: 'password', locked, observations: 'password locked' } }),
        sprite('note', 112, 112, 20, 20, { depth: 50, data: { type: 'notes', observations: 'A handwritten note.' } })
    ];
    const lockedWorld = world({ player, objects: mk(true) });
    lockedWorld.tap(116, 116);
    const lockedMenu = Object.fromEntries(lockedWorld.state.lastMenu.map(c => [c.label, c.detail]));
    assert.equal(lockedMenu.derek_pc, 'password locked');
    assert.equal(lockedMenu.note, 'A handwritten note.');
    const openWorld = world({ player, objects: mk(false) });
    openWorld.tap(116, 116);
    const openMenu = Object.fromEntries(openWorld.state.lastMenu.map(c => [c.label, c.detail]));
    assert.equal(openMenu.derek_pc, null, 'an unlocked PC drops its observations');
    assert.equal(openMenu.note, 'A handwritten note.', 'a non-PC object is unchanged');
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
test('handler m3: a far object drawn over a far NPC: both far pixel hits, a step towards both (overlap plan D1 rule 3)', () => {
    const player = { x: 150, y: 200 };
    const sarah = npc('sarah', 128, 41, { depth: 81 });
    const log_ = sprite('signin_log', 120, 50, 20, 16, { depth: 90 });
    const w = world({ player, objects: [log_], npcs: [sarah] });
    w.tap(128, 55);                              // on the log and on her figure
    assert.ok(walkedTo(w.log) && !w.log.some(l => l.startsWith('talk') || l.startsWith('use')));
    assert.equal(w.pendingTapUse.get(), null);
    assert.deepEqual(w.pendingOverlapWalk.get()?.obj.map(h => h.id), ['signin_log', 'sarah']);
});

test('handler m3: an object drawn under the NPC\'s figure leaves the tap to her', () => {
    const player = { x: 150, y: 200 };
    const sarah = npc('sarah', 128, 41, { depth: 81 });
    const board = sprite('board', 110, 20, 40, 40, { depth: 10 });
    const w = world({ player, objects: [board], npcs: [sarah] });
    w.tap(128, 40);
    assert.ok(walkedTo(w.log));
    assert.equal(w.pendingTapUse.get(), null, 'a step towards both, nothing used');
    assert.deepEqual(w.pendingOverlapWalk.get()?.obj.map(h => h.id), ['sarah', 'board']);
});

// ── the menu entry arms the pending use ──
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

test('handler: both in reach under the tap keeps the menu, topmost first (D14)', () => {
    const player = { x: 125, y: 100 };
    const omar = npc('omar', 120, 104, { depth: 60 });
    const pc = sprite('omar_pc', 112, 92, 32, 24, { depth: 50 });
    const w = world({ player, objects: [pc], npcs: [omar] });
    w.tap(120, 100);
    assert.deepEqual(w.log, ['menu:omar|omar_pc']);
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

test('handler R2 m1: both in reach, a tap on the log drawn over her opens the menu (D5); her uncovered figure too', () => {
    const player = { x: 140, y: 80 };
    const sarah = npc('sarah', 150, 60, { depth: 80 });
    const log_ = sprite('signin_log', 145, 62, 12, 8, { depth: 95 });    // in reach, over her figure
    const w = world({ player, objects: [log_], npcs: [sarah] });
    w.tap(150, 65);
    assert.deepEqual(w.log, ['menu:signin_log|sarah']);
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
    assert.deepEqual(w.state.moveOpts, { avoidNpcs: true }, 'the walk goes round standing NPCs');
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

// ── Overlap plan: the far overlap walk, the pixel pick, hostiles and doors (handler tests 16 to 36) ──
const diamond = (lx, ly) => Math.abs(lx - 7.5) + Math.abs(ly - 7.5) <= 8;
const copierAt = () => sprite('copier', 100, 100, 35, 46, { depth: 10 });
const printoutAt = () => sprite('printout', 110, 100, 16, 16, { depth: 11, shape: diamond });
const doorAt = (id, x, y, extra = {}) => sprite(id, x, y, 32, 32, { doorProperties: { direction: 'north', roomId: 'r1',
    connectedRoom: 'r2', open: false }, ...extra });

test('overlap 16: a far click on the printout over the copier walks to where both reach, uses nothing, opens nothing', () => {
    const player = { x: 200, y: 200 };
    const w = world({ player, objects: [copierAt(), printoutAt()] });
    w.tap(118, 108);
    assert.deepEqual(w.log, ['walk:111,111']);
    assert.deepEqual(w.state.moveOpts, { avoidNpcs: true });
    assert.equal(w.pendingTapUse.get(), null);
    assert.deepEqual(w.pendingOverlapWalk.get()?.obj.map(h => h.id), ['printout', 'copier']);
});

test('overlap 17: the same click with both in reach opens the menu, printout first, the walk stopped', () => {
    const player = { x: 112, y: 112 };
    const w = world({ player, objects: [copierAt(), printoutAt()] });
    w.tap(118, 108);
    assert.deepEqual(w.log, ['menu:printout|copier']);
    assert.equal(w.state.stopped, 1);
    assert.equal(w.state.menuOpts.numberKeys, true);
    assert.equal(w.state.menuOpts.keyboard, true);
    assert.equal(w.state.menuOpts.holdKeys, true);
});

test('overlap 18: printout in reach, copier far: the printout is used at once (D1 rule 2)', () => {
    const player = { x: 130, y: 120 };
    const w = world({ player, objects: [copierAt(), printoutAt()] });
    w.tap(118, 108);
    assert.deepEqual(w.log, ['use:printout']);
});

test('overlap 19: after a walk that stopped short with one hit now in reach, the click acts on what is in reach', () => {
    const player = { x: 128, y: 118 };            // printout 24 px: in reach; copier 33: far
    const w = world({ player, objects: [copierAt(), printoutAt()] });
    w.tap(118, 108);
    assert.deepEqual(w.log, ['use:printout']);
});

test('overlap 20: the only spot found is the player\'s own, hits out of reach: a plain far click on the topmost hit, no toast, no overlap walk', () => {
    const player = { x: 200, y: 200 };
    const w = world({ player, objects: [copierAt(), printoutAt()] });
    w.win.pathfindingManager = { findNearestWalkableWorldCell: () => ({ x: player.x, y: player.y }) };
    w.tap(118, 108);
    assert.ok(walkedTo(w.log));
    assert.equal(w.pendingOverlapWalk.get(), null);
    assert.equal(w.pendingTapUse.get()?.obj?.id, 'printout');
    assert.ok(!w.log.some(l => l.startsWith('alert') || l.startsWith('menu')));
});

test('overlap 21: no spot reaches every hit: one far click on the topmost hit, walked to and used on arrival, no overlap walk', () => {
    const player = { x: 300, y: 165 };
    const tall = sprite('tall', 100, 100, 10, 80, { depth: 0 });
    const low = sprite('low', 100, 160, 10, 10, { depth: 5 });
    const w = world({ player, objects: [tall, low] });
    w.tap(105, 165);
    assert.ok(walkedTo(w.log), 'walks');
    assert.equal(w.pendingOverlapWalk.get(), null, 'no overlap walk armed');
    assert.equal(w.pendingTapUse.get()?.obj?.id, 'low', 'the topmost hit is a normal pending use');
    assert.ok(!w.log.some(l => l.startsWith('menu') || l.startsWith('use')));
});

test('overlap 22b (R5 M1): a walk that ends 7 px short with one hit out of reach takes one retry step past the stand point, far enough to move', () => {
    const wide = (id, x) => sprite(id, x, 100, 60, 30, { depth: id === 'b' ? 11 : 10 });
    const player = { x: 400, y: 115 };
    const w = world({ player, objects: [wide('a', 100), wide('b', 156)] });
    w.win.pathfindingManager = { findNearestWalkableWorldCell: (x, y) => ({ x, y }) };
    w.tap(158, 110);
    const stand = w.log.find(l => l.startsWith('walk:')).slice(5).split(',').map(Number);
    assert.equal(w.log.length, 1);
    // The walk ended 7 px short on its approach side: b is in reach, a is not
    player.x = stand[0] + 7; player.y = stand[1]; w.state.moving = false;
    assert.ok(w.deps.isObjectInInteractionRange(w.win.rooms.r1.objects.b) && !w.deps.isObjectInInteractionRange(w.win.rooms.r1.objects.a));
    w.pendingOverlapWalk.update(Date.now() + 100);
    const walks = w.log.filter(l => l.startsWith('walk:'));
    assert.equal(walks.length, 2, `one retry step: ${w.log.join()}`);
    const [rx, ry] = walks[1].slice(5).split(',').map(Number);
    assert.ok(Math.hypot(rx - player.x, ry - player.y) > 8, `the retry target (${rx},${ry}) is more than 8 px from the feet (${player.x},${player.y})`);
    assert.ok(w.pendingOverlapWalk.get(), 'still waiting on the retry step');
    // ...and only one: back at rest still short, it finishes with what is in reach
    w.state.moving = false;
    w.pendingOverlapWalk.update(Date.now() + 700);
    assert.equal(w.log.filter(l => l.startsWith('walk:')).length, 2, 'no second retry');
    assert.equal(w.pendingOverlapWalk.get(), null);
});

test('overlap 22c (R2 M1): the walk ends 7 px short with neither hit in reach: one retry step, then the far click on the topmost hit', () => {
    const player = { x: 200, y: 200 };
    const w = world({ player, objects: [copierAt(), printoutAt()] });
    w.tap(118, 108);
    const stand = w.log.find(l => l.startsWith('walk:')).slice(5).split(',').map(Number);
    player.x = stand[0] + 5; player.y = stand[1] + 5; w.state.moving = false;
    w.ovr.out = new Set(['copier', 'printout']);
    const t0 = Date.now();
    w.pendingOverlapWalk.update(t0 + 100);
    assert.equal(w.log.filter(l => l.startsWith('walk:')).length, 2, 'the retry step: ' + w.log.join());
    assert.ok(w.pendingOverlapWalk.get(), 'pending while the step runs');
    w.state.moving = false;
    w.pendingOverlapWalk.update(t0 + 800);
    assert.ok(!w.log.some(l => l.startsWith('alert')), 'no dead-end message: ' + w.log.join());
    assert.equal(w.pendingTapUse.get()?.obj?.id, 'printout', 'handed over to the normal far click');
    assert.equal(w.log.filter(l => l.startsWith('walk:')).length, 3, 'which walks');
});

test('overlap 22d (R2 M1): a second click within 8 px of the stand point with nothing in reach is never the toast: a step, or the far click', () => {
    const player = { x: 200, y: 200 };
    const w = world({ player, objects: [copierAt(), printoutAt()] });
    w.tap(118, 108);
    const stand = w.log.find(l => l.startsWith('walk:')).slice(5).split(',').map(Number);
    player.x = stand[0] + 5; player.y = stand[1] + 5; w.state.moving = false;
    w.ovr.out = new Set(['copier', 'printout']);
    w.log.length = 0;
    w.tap(118, 108);
    assert.ok(!w.log.some(l => l.startsWith('alert')), 'no toast: ' + w.log.join());
    assert.equal(w.log.filter(l => l.startsWith('walk:')).length, 1, 'it walks (past the stand point): ' + w.log.join());
    assert.ok(w.pendingOverlapWalk.get(), 'and watches the step');
    // No cell to step to (the pathfinder finds none at radius 1): the normal far click on the topmost hit
    const w2 = world({ player: { x: 200, y: 200 }, objects: [copierAt(), printoutAt()] });
    w2.win.pathfindingManager = { findNearestWalkableWorldCell: (x, y, r) => (r === 1 ? null : { x, y }) };
    w2.tap(118, 108);
    const s2 = w2.log.find(l => l.startsWith('walk:')).slice(5).split(',').map(Number);
    const p2 = w2.deps.player; p2.x = s2[0] + 5; p2.y = s2[1] + 5; w2.state.moving = false;
    w2.ovr.out = new Set(['copier', 'printout']);
    w2.log.length = 0;
    w2.tap(118, 108);
    assert.ok(!w2.log.some(l => l.startsWith('alert')), 'no toast: ' + w2.log.join());
    assert.equal(w2.pendingOverlapWalk.get(), null);
    assert.equal(w2.pendingTapUse.get()?.obj?.id, 'printout');
});

test('overlap 22e (R2 n6): a retry step still waiting on the pathfinder is not dropped; it is after the grace', () => {
    const wide = (id, x) => sprite(id, x, 100, 60, 30, { depth: id === 'b' ? 11 : 10 });
    const player = { x: 400, y: 115 };
    const w = world({ player, objects: [wide('a', 100), wide('b', 156)] });
    w.win.pathfindingManager = { findNearestWalkableWorldCell: (x, y) => ({ x, y }) };
    w.tap(158, 110);
    const stand = w.log.find(l => l.startsWith('walk:')).slice(5).split(',').map(Number);
    player.x = stand[0] + 7; player.y = stand[1]; w.state.moving = false;
    const t0 = Date.now();
    w.pendingOverlapWalk.update(t0 + 100);         // the retry starts; the player is not moving yet
    w.state.moving = false;
    w.pendingOverlapWalk.update(t0 + 200);         // inside the grace: still pending
    assert.ok(w.pendingOverlapWalk.get(), 'kept while the step is not under way');
    w.pendingOverlapWalk.update(t0 + 600);         // grace over: finishes with what is in reach
    assert.equal(w.pendingOverlapWalk.get(), null);
});

test('overlap 22f (R2 n1): the live-proof hooks are cleared at the start of each click', () => {
    const player = { x: 200, y: 200 };
    const w = world({ player, objects: [copierAt(), printoutAt()] });
    w.tap(118, 108);
    assert.equal(w.win.__overlapStand?.joint, true);
    w.win.__overlapRetried = { stale: true };
    player.x = 112; player.y = 112; w.state.moving = false;
    w.tap(300, 300);                               // a plain floor click
    assert.equal(w.win.__overlapStand, null);
    assert.equal(w.win.__overlapRetried, null);
});

test('overlap 22: the overlap watcher: silent on arrival in reach, says why when stopped or blocked, cleared by a click', () => {
    const player = { x: 200, y: 200 };
    const w = world({ player, objects: [copierAt(), printoutAt()] });
    w.tap(118, 108);
    const t0 = Date.now();
    player.x = 112; player.y = 112; w.state.moving = false;
    w.pendingOverlapWalk.update(t0 + 100);
    assert.equal(w.pendingOverlapWalk.get(), null);
    assert.deepEqual(w.log, ['walk:111,111'], 'nothing used, nothing said');
    const p2 = { x: 200, y: 200 };
    const w2 = world({ player: p2, objects: [copierAt(), printoutAt()] });
    w2.tap(118, 108); w2.state.moving = false;
    const t2 = Date.now();
    w2.pendingOverlapWalk.update(t2 + 500);                       // nothing in reach: the one retry step
    assert.equal(w2.log.filter(l => l.startsWith('walk:')).length, 2, w2.log.join());
    w2.state.moving = false;
    w2.pendingOverlapWalk.update(t2 + 1000);                      // retry spent, still nothing in reach: hand over (R2 M1)
    assert.ok(!w2.log.some(l => l.startsWith('alert')), 'no dead-end toast: ' + w2.log.join());
    assert.equal(w2.pendingOverlapWalk.get(), null);
    assert.equal(w2.pendingTapUse.get()?.obj?.id, 'printout', 'the normal far click on the topmost hit');
    const p3 = { x: 200, y: 200 };
    const w3 = world({ player: p3, objects: [copierAt(), printoutAt()] });
    w3.tap(118, 108);
    w3.pendingOverlapWalk.update(Date.now() + 1500);
    assert.ok(w3.log.includes("alert:Something's in the way."), w3.log.join());
    const w4 = world({ player: { x: 200, y: 200 }, objects: [copierAt(), printoutAt()] });
    w4.tap(118, 108);
    w4.tap(300, 300);
    assert.equal(w4.pendingOverlapWalk.get(), null);
});

test('overlap 23: a far click on the copier through the printout\'s transparent corner walks to the copier (D4)', () => {
    const player = { x: 200, y: 200 };
    const w = world({ player, objects: [copierAt(), printoutAt()] });
    w.tap(110.5, 100.5);
    assert.ok(walkedTo(w.log));
    assert.equal(w.pendingTapUse.get()?.obj.id, 'copier');
});

test('overlap 24: two NPC frames, the nearer off her figure, the other on hers: walks to the other (D4)', () => {
    const player = { x: 150, y: 300 };
    const a = npc('a', 150, 45), b = npc('b', 150, 0);
    const w = world({ player, npcs: [a, b] });
    w.tap(150, 23);                              // 22 px from a's centre (off her figure), 23 from b's (on his)
    assert.deepEqual(w.log, ['walk:150,64'], 'stops short of b, not a (a would be 150,109)');
});

test('overlap 25 and 29: a door under a transparent object corner is the door\'s (D4); in reach it acts once (D10)', () => {
    const plant = () => sprite('plant', 95, 95, 20, 20, { depth: 50, shape: (lx) => lx < 5 });
    const far = world({ player: { x: 300, y: 300 }, objects: [plant()], doors: [doorAt('door1', 100, 100)] });
    far.tap(110, 110);
    assert.deepEqual(far.log, ['walk:100,132']);
    const near = world({ player: { x: 110, y: 140 }, objects: [plant()], doors: [doorAt('door1', 100, 100)] });
    near.tap(110, 110);
    assert.deepEqual(near.log, ['door:door1']);
    const alone = world({ player: { x: 110, y: 140 }, doors: [doorAt('door1', 100, 100)] });
    alone.tap(110, 110);
    assert.deepEqual(alone.log, ['door:door1'], 'one door call, no zone');
});

test('overlap 26: an NPC standing on a door: in reach the menu; far a step', () => {
    const mk = (player) => world({ player, npcs: [npc('guard', 116, 110, { depth: 60 })], doors: [doorAt('door1', 100, 100)] });
    const near = mk({ x: 116, y: 135 });
    near.tap(116, 115);
    assert.deepEqual(near.log, ['menu:guard|door1'.replace('door1', 'Door')]);
    const far = mk({ x: 300, y: 300 });
    far.tap(116, 115);
    assert.ok(walkedTo(far.log) && far.pendingOverlapWalk.get(), far.log.join());
});

test('overlap 27 and 32: seats give way; a far chair over a far PC still sits', () => {
    const chair = () => sprite('chair', 110, 110, 20, 20, { depth: 50, seat: true });
    for (const thing of [sprite('stick', 125, 125, 20, 20, { depth: 40, data: { takeable: true } }), sprite('pc', 125, 125, 20, 20, { depth: 40 })]) {
        const w = world({ player: { x: 100, y: 100 }, objects: [chair(), thing] });
        w.tap(128, 128);
        assert.ok(walkedTo(w.log) && !w.log.some(l => l.startsWith('sit')), w.log.join());
        assert.equal(w.pendingTapUse.get()?.obj.id, thing.id);
    }
    const w = world({ player: { x: 300, y: 300 }, objects: [chair(), sprite('pc', 125, 125, 20, 20, { depth: 40 })] });
    w.tap(128, 128);
    assert.ok(w.log.includes('sit:chair'), w.log.join());
});

test('overlap 28: a far NPC on her figure and a far object on its pixels: a step, no talk, no use', () => {
    const w = world({ player: { x: 300, y: 300 }, objects: [sprite('box', 140, 50, 20, 20, { depth: 90 })], npcs: [npc('sarah', 150, 60, { depth: 80 })] });
    w.tap(150, 60);
    assert.ok(walkedTo(w.log) && !w.log.some(l => /^(talk|use|menu)/.test(l)), w.log.join());
    assert.equal(w.pendingOverlapWalk.get()?.obj.length, 2);
});

test('overlap 31: hostiles never join a menu; a far one takes the tap only when nothing in reach is under it; a far hostile on her figure with an in-reach object under the tap: the object acts, as today', () => {
    // a far hostile on her figure over a far object: walked towards, no overlap walk
    const a = world({ player: { x: 150, y: 300 }, objects: [sprite('pc', 140, 50, 20, 20, { depth: 10 })], npcs: [npc('thug', 150, 60, { depth: 80 })], hostile: ['thug'] });
    a.tap(150, 60);
    assert.ok(walkedTo(a.log) && !a.pendingOverlapWalk.get(), a.log.join());
    // a far hostile on her figure with an in-reach object under the tap: the object acts (today's rule)
    const b = world({ player: { x: 150, y: 75 }, objects: [sprite('pc', 145, 45, 10, 10)], npcs: [npc('thug', 150, 30, { depth: 80 })], hostile: ['thug'] });
    b.tap(150, 50);
    assert.deepEqual(b.log, ['use:pc']);
    // an in-reach hostile whose frame holds the tap, with an in-reach object: struck, no menu
    const c = world({ player: { x: 140, y: 80 }, objects: [sprite('pc', 160, 60, 10, 10)], npcs: [npc('thug', 150, 60)], hostile: ['thug'] });
    c.tap(165, 65);
    assert.deepEqual(c.log, ['talk:thug']);
    // an in-reach hostile only near the tap, an in-reach PC under it: the PC
    const d = world({ player: { x: 140, y: 80 }, objects: [sprite('pc', 150, 100, 10, 10)], npcs: [npc('thug', 120, 60)], hostile: ['thug'] });
    d.tap(155, 105);
    assert.deepEqual(d.log, ['use:pc']);
});

test('overlap 31 (R4 m4): a far hostile in another room whose frame holds the tap leaves an in-reach switch to be used', () => {
    const player = { x: 100, y: 150, room: 'south' };
    const north = npc('north_npc', 100, 85, { room: 'north' });
    const sw = sprite('switch', 105, 125, 10, 10, { room: 'south' });   // 26 px: in reach, near the tap
    const w = world({ player, objects: [sw], npcs: [north], hostile: ['north_npc'], roomOf: (t) => t.room || 'south' });
    w.tap(100, 105);
    assert.deepEqual(w.log, ['use:switch']);
});

test('overlap 33: an in-reach owner walking away from her far PC under the same tap: the PC is walked to and used', () => {
    const player = { x: 128, y: 130 };
    const omar = npc('omar', 120, 104, { depth: 60 });
    const pc = sprite('omar_pc', 140, 92, 32, 24, { depth: 50 });
    const w = world({ player, objects: [pc], npcs: [omar] });
    reachMod.walkAwayTracker.sample?.(player, () => [omar], 0);
    omar.x = 100; reachMod.walkAwayTracker.sample?.(player, () => [omar], 400);
    omar.x = 120;
    w.tap(150, 100);
    assert.ok(walkedTo(w.log) && !w.log.some(l => l.startsWith('talk')), w.log.join());
    assert.equal(w.pendingTapUse.get()?.obj, pc);
});

test('overlap 34: in a fight the far overlap runs today\'s branches and the menu holds no keys', () => {
    const thug = () => npc('thug', 400, 400);
    const far = world({ player: { x: 200, y: 200 }, objects: [copierAt(), printoutAt()], npcs: [thug()], hostile: ['thug'] });
    far.tap(118, 108);
    assert.equal(far.pendingOverlapWalk.get(), null);
    assert.equal(far.pendingTapUse.get()?.obj.id, 'printout', 'today: the topmost walked to and used');
    const near = world({ player: { x: 112, y: 112 }, objects: [copierAt(), printoutAt()], npcs: [thug()], hostile: ['thug'] });
    near.tap(118, 108);
    assert.deepEqual(near.log, ['menu:printout|copier']);
    assert.equal(near.state.stopped, undefined);
    assert.deepEqual([near.state.menuOpts.numberKeys, near.state.menuOpts.keyboard, near.state.menuOpts.holdKeys], [false, false, false]);
});

test('overlap 35: roomHasActiveHostile reads her current room and skips the knocked out', () => {
    const player = { x: 0, y: 0 };
    assert.equal(world({ player, npcs: [npc('thug', 50, 50)], hostile: ['thug'] }).roomHasActiveHostile(), true);
    assert.equal(world({ player, npcs: [npc('thug', 50, 50)], hostile: ['thug'], ko: ['thug'] }).roomHasActiveHostile(), false);
    assert.equal(world({ player, npcs: [npc('thug', 50, 50, { room: 'r2' })], hostile: ['thug'], roomOf: (t) => t.room || 'r1' }).roomHasActiveHostile(), false);
    assert.equal(world({ player, npcs: [npc('pal', 50, 50)] }).roomHasActiveHostile(), false);
});

test('overlap 36: inReachFrom converts the feet point to the sprite position and keeps a 12 px margin', () => {
    const player = { x: 0, y: 0, body: { center: { x: 0, y: 31 }, halfHeight: 10 } };
    const w = world({ player });
    const hit = { id: 'h', x: 0, y: 10 };
    assert.equal(w.inReachFrom({ x: 0, y: 41 }, hit), true, 'feet 31 below: the sprite stands on it');
    assert.equal(w.inReachFrom({ x: 0, y: 15 }, hit), false, 'feet 5 px away, sprite 26 px away');
    assert.equal(w.inReachFrom({ x: 0, y: 61 }, hit), true, '20 px: inside the margin');
    assert.equal(w.inReachFrom({ x: 0, y: 62 }, hit), false, '21 px: outside');
    assert.equal(w.inReachFrom({ x: 0, y: 92 }, { x: 0, y: 10, doorProperties: {} }), true, 'a door: 52 px');
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
