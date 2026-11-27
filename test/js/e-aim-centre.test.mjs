// E aims at the object's centre from the player's feet (interactions.js consider, info-label.js,
// the test bridge's face prediction). It used to take the angle from the sprite centre (about 31 px
// above the feet) to the object's top edge, so a 33px safe flush against a 47px filing cabinet read
// further off "up" than the cabinet and E opened the cabinet (m01 Derek's office).
//
//   - aimY is the vertical counterpart of aimX; doors, NPCs and sprites without scenario data keep sprite.y.
//   - The safe and cabinet pair picks the one in front, standing flush at either.
//   - A small item on a wide desk beats the desk; an item in line with a wall board beats the board.
//   - The E label (info-label.js) names what E would open.
//
// Run with: node test/js/e-aim-centre.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { aimX, aimY, aimDiff, reachY, BODY_AIM_MAX_PX, reachYSeated, isSeatedDeskPc, isDeskComputer, seatedPcWins, SEATED_PC_FRONT_DEG } from '../../public/break_escape/js/systems/interaction-reach.js';
const OLD = process.env.EAIM_OLD_INTERACTIONS;

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const dir = mkdtempSync(join(tmpdir(), 'eaim-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const stubs = {
    '../utils/constants.js': 'export const INTERACTION_RANGE=32, INTERACTION_RANGE_SQ=1024, INTERACTION_CHECK_INTERVAL=0, DOOR_INTERACTION_RANGE_SQ=0; export function overlayDepth(){return 0;}',
    '../core/rooms.js': 'export const rooms = (globalThis.__testRooms = {});',
    '../core/player.js': 'export function facePlayerToward(x, y){ (globalThis.__faceCalls ||= []).push([x, y]); }',
    './unlock-system.js': 'export function handleUnlock(){}',
    './doors.js': 'export function handleDoorInteraction(){}',
    './biometrics.js': 'export function collectFingerprint(){} export function handleBiometricScan(){}',
    './inventory.js': 'export function addToInventory(){return true;} export function createItemIdentifier(){return "";}',
    './ui-sounds.js': 'export function playUISound(){} export function playGameSound(){}',
    './apply-actions.js': 'export function applyActions(){}',
    '../utils/conditional-text.js': 'export function resolveObjectField(obj,key){ return obj ? obj[key] : undefined; }',
    '../utils/flag-lock.js': 'export function isRemoteFlagLock(){return false;} export function remoteFlagLockMessage(){return "";}',
    './npc-reach.js': 'export function npcReachDistSq(p, s, d){return s.__reachSq ?? d;}',
    './examine.js': 'export function shouldExamine(){return false;} export function startExamine(){return false;}',
    './combat-input.js': 'export function showPastTalkingToast(){}',
    './consumables.js': 'export function shouldConsumeOnInteract(){return false;} export function useConsumable(){}',
    './interaction-walls.js': 'export function interactionLineClear(){return true;}',
    '../utils/locked-hint.js': 'export function hintToastMs(){ return 6000; }',
    './requires-item-hint.js': 'export function requiresItemHint(){ return ""; }',
    './pc-policy.js': readFileSync(join(js, 'systems/pc-policy.js'), 'utf8'),
    './interaction-reach.js': readFileSync(join(js, 'systems/interaction-reach.js'), 'utf8'),
    './minigame-registry.js': 'export function hasMinigameStarter(){return false;} export function startRegisteredMinigame(){}',
    '../utils/display-dashes.js': 'export function displayDashes(s){ return s; }',
    '../utils/escape-html.js': 'export function escapeHtml(s){ return String(s ?? ""); }',
    './inventory-menu.js': 'export function hasTriggerOnInteract(){return false;} export function isDroppableInventoryItem(){return false;} export function dropInventoryItem(){} export function inventoryMenuFor(){return null;}',
};
let src = readFileSync(OLD || join(js, 'systems/interactions.js'), 'utf8');
for (const [spec, body] of Object.entries(stubs)) {
    const before = src;
    src = src.split(`'${spec}'`).join(`'${dataUrl(body)}'`);
    if (src === before) throw new Error(`import specifier not found to stub: ${spec}`);
}
writeFileSync(join(dir, 'interactions.mjs'), src);
globalThis.window = {};
const { tryInteractWithNearest, isObjectInInteractionRange } = await import(pathToFileURL(join(dir, 'interactions.mjs')).href);

const picked = [];
window.playerPoses = { use: (s) => picked.push(s.scenarioData.id) };
const obj = (id, x, y, w, h, extra = {}) => ({ x, y, displayWidth: w, displayHeight: h, originX: 0, originY: 0,
    active: true, interactable: true, visible: true, scenarioData: { id }, ...extra });
// The player's sprite sits 31 px above the feet; body.center is the feet (footOf)
const standAt = (fx, fy, direction = 'up') => ({ x: fx, y: fy - 31, direction, body: { center: { x: fx, y: fy } } });
const setRoom = (...objs) => {
    for (const k of Object.keys(globalThis.__testRooms)) delete globalThis.__testRooms[k];
    globalThis.__testRooms.r = { objects: Object.fromEntries(objs.map(o => [o.scenarioData.id, o])) };
};
const pressE = (fx, fy, direction = 'up') => {
    picked.length = 0;
    window.player = standAt(fx, fy, direction);
    try { tryInteractWithNearest(); } catch (e) { /* the handler runs on stubs; only the pick matters */ }
    return picked[0];
};

// m01 Derek's office: safe3 24x33 beside the 29x47 derek_cabinet, both with their feet on y 66
const safe = () => obj('safe', 106, 33, 24, 33);
const cabinet = () => obj('cabinet', 77, 19, 29, 47);

test('aimY: the vertical centre of a scenario object; doors, NPCs and bare sprites keep sprite.y', () => {
    const s = safe();
    assert.equal(aimY(s), 49.5);
    assert.equal(aimX(s), 118);
    assert.equal(aimY({ ...s, originY: 0.5 }), 33);
    assert.equal(aimY({ ...s, _isNPC: true }), 33);
    assert.equal(aimY({ ...s, doorProperties: {} }), 33);
    assert.equal(aimY({ ...s, scenarioData: undefined }), 33);
    assert.equal(aimY({ ...s, displayHeight: 0, height: 0 }), 33);
    assert.equal(aimY(null), 0);
});

test('E: flush south of the safe, at its right half, opens the safe and not the cabinet', () => {
    setRoom(safe(), cabinet());
    assert.equal(pressE(128, 69), 'safe');
    assert.equal(pressE(118, 69), 'safe');
    assert.equal(pressE(110, 69), 'safe');
});

// Guard, not a regression pin: the old aim also picked the cabinet here. It stops the fix going the other
// way, with the safe stealing the cabinet's own half.
test('E: flush south of the cabinet opens the cabinet and not the safe', () => {
    setRoom(safe(), cabinet());
    assert.equal(pressE(94, 69), 'cabinet');
    assert.equal(pressE(82, 69), 'cabinet');
    assert.equal(pressE(100, 69), 'cabinet');
});

// A 100x50 desk is "tall" (reachY clamps to its body), so dead ahead of both the range tie-break goes to the
// desk; the item wins when the player stands a little to one side of it, which is where the aim matters.
test('E: a small item on a wide desk beats the desk when the player stands beside it', () => {
    const desk = obj('desk', 100, 100, 100, 50);
    const item = obj('item', 142, 110, 16, 16);
    setRoom(desk, item);
    assert.equal(pressE(140, 152), 'item');
    assert.equal(pressE(120, 152), 'item');
});

test('E: an item on a desk is not stolen by a wide wall board above and to the left of it', () => {
    const desk = obj('desk', 100, 100, 100, 50);
    const item = obj('item', 142, 110, 16, 16);
    // 80 wide, bottom on y 88: in reach from (140, 150) through reachX/reachY
    const board = obj('board', 60, 58, 80, 30, { scenarioData: { id: 'board', wallMounted: true } });
    setRoom(desk, item, board);
    assert.equal(pressE(140, 150), 'item');
});

test('E: standing at the desk facing up, the desk wins over the wall board above it', () => {
    const desk = obj('desk', 100, 100, 100, 50);
    const board = obj('board', 120, 58, 60, 30, { scenarioData: { id: 'board', wallMounted: true } });
    setRoom(desk, board);
    assert.equal(pressE(150, 150), 'desk');   // the desk, nearer and just as faced; pinned so a change of rule shows
});

// Guard only: with one object dead ahead the old code also left the player where they stood. It pins that the
// shifted facePlayerToward call below is not made when nothing needs turning.
test('E: a lone object ahead is picked and the player is not turned when it is in front', () => {
    globalThis.__faceCalls = [];
    setRoom(safe());
    assert.equal(pressE(118, 69), 'safe');
    assert.deepEqual(globalThis.__faceCalls, []);
});

test('E: an object off to the side turns the player the same way the feet-to-centre angle points', () => {
    globalThis.__faceCalls = [];
    setRoom(obj('crate', 120, 40, 24, 24));   // centre (132, 52); feet (100, 62): almost level, to the right
    assert.equal(pressE(100, 62, 'up'), 'crate');
    const [[tx, ty]] = globalThis.__faceCalls;
    // facePlayerToward aims from the sprite centre (100, 31): the point is shifted so the direction is the feet's
    assert.equal(tx - 100, 132 - 100);
    assert.equal(ty - 31, 52 - 62);
});

// ---------------------------------------------------------------------------
// The E label names what E opens
// ---------------------------------------------------------------------------
const ldir = mkdtempSync(join(tmpdir(), 'eaim-label-'));
writeFileSync(join(ldir, 'package.json'), '{"type":"module"}\n');
writeFileSync(join(ldir, 'constants.js'), 'export const INTERACTION_RANGE = 32; export const INTERACTION_RANGE_SQ = 32 * 32;');
writeFileSync(join(ldir, 'conditional-text.js'),
    'export function resolveObjectField(data, field, fallback) { const v = data && data[field]; return typeof v === "function" ? v() : (v || fallback); }');
writeFileSync(join(ldir, 'display-dashes.js'), 'export const displayDashes = t => t;');
writeFileSync(join(ldir, 'computer-keywords.js'), readFileSync(join(js, 'utils/computer-keywords.js'), 'utf8'));
writeFileSync(join(ldir, 'pc-observations.js'), readFileSync(join(js, 'utils/pc-observations.js'), 'utf8'));
writeFileSync(join(ldir, 'walls.js'), 'export const interactionLineClear = () => true;');
writeFileSync(join(ldir, 'reach.js'), readFileSync(join(js, 'systems/interaction-reach.js'), 'utf8'));
writeFileSync(join(ldir, 'npc-reach.js'), 'export function npcReachDistSq(p, s, d){return s.__reachSq ?? d;}');
writeFileSync(join(ldir, 'info-label.js'), readFileSync(join(js, 'ui/info-label.js'), 'utf8')
    .replace("'../utils/constants.js'", "'./constants.js'")
    .replace("'../utils/conditional-text.js'", "'./conditional-text.js'")
    .replace("'../utils/display-dashes.js'", "'./display-dashes.js'")
    .replace("'../utils/pc-observations.js'", "'./pc-observations.js'")
    .replace("'../systems/interaction-walls.js'", "'./walls.js'")
    .replace("'../systems/interaction-reach.js'", "'./reach.js'")
    .replace("'../systems/npc-reach.js'", "'./npc-reach.js'"));
const classes = new Set();
const label = { id: 'hud-info-label', textContent: '', setAttribute() {},
    classList: { add: c => classes.add(c), remove: c => classes.delete(c) } };
let created = null;
globalThis.document = { getElementById: () => created, createElement: () => label, body: { appendChild: el => { created = el; } } };
let clock = 0;
globalThis.performance = { now: () => clock };
const { createInfoLabel, updateInfoLabel } = await import(pathToFileURL(join(ldir, 'info-label.js')).href);
createInfoLabel();
const labelAt = (fx, fy, direction = 'up') => {
    window.rooms = globalThis.__testRooms;
    window.player = standAt(fx, fy, direction);
    clock += 150;
    updateInfoLabel();
    return classes.has('visible') ? label.textContent : null;
};

test('the E label agrees with E for the safe and cabinet pair, flush at either', () => {
    const s = safe(), c = cabinet();
    s.scenarioData.observations = 'A safe.';
    c.scenarioData.observations = 'A filing cabinet.';
    setRoom(s, c);
    for (const [fx, id, text] of [[128, 'safe', 'A safe.'], [118, 'safe', 'A safe.'], [94, 'cabinet', 'A filing cabinet.'], [82, 'cabinet', 'A filing cabinet.']]) {
        assert.equal(pressE(fx, 69), id, `E at ${fx}`);
        assert.equal(labelAt(fx, 69), text, `label at ${fx}`);
    }
});

test('the E label agrees with E for an item on a desk', () => {
    const desk = obj('desk', 100, 100, 100, 50);
    const item = obj('item', 142, 110, 16, 16);
    desk.scenarioData.observations = 'A desk.';
    item.scenarioData.observations = 'An item.';
    setRoom(desk, item);
    assert.equal(pressE(140, 152), 'item');
    assert.equal(labelAt(140, 152), 'An item.');
});

// The body-to-top-edge aim is only for props under BODY_AIM_MAX_PX. Beside a tall prop it reads almost straight
// up and beat a short neighbour's feet angle (review R1 M1).
test('aimDiff: a prop of BODY_AIM_MAX_PX or more is aimed at from the feet only', () => {
    const player = standAt(137, 203);
    const tall = obj('t', 100, 130, 29, 70), short = obj('s', 132, 180, 24, 20);
    assert.equal(BODY_AIM_MAX_PX, 40);
    const feetOnly = (o) => aimDiff(player, o, aimX(o), aimY(o), 270);
    assert.equal(feetOnly(obj('h40', 132, 160, 24, 40)).fromY, 203);   // feet, not the sprite centre (172)
    const s = feetOnly(short);
    assert.ok(s.diff < feetOnly(tall).diff);
    assert.deepEqual([s.x, s.y], [aimX(short), aimY(short)]);
});

test('aimDiff: a short prop level with the player is aimed at from the body when that angle is smaller', () => {
    const player = standAt(140, 80, 'left');
    const crate = obj('c', 116, 56, 24, 24);   // under 40px, feet level with the player's, just left of them
    const r = aimDiff(player, crate, aimX(crate), aimY(crate), 180);
    assert.equal(r.fromY, 49);                  // the sprite centre (80 - 31)
    assert.equal(r.y, 56);                      // the top edge
});

// A 24x20 box beside a 29x70 cabinet: standing under the box facing up, E and the label both name the box.
// The mixed rule at 2fbc9aa41 let the cabinet's top-edge angle (straight up) win here.
test('E and the label pick a short prop over a very tall neighbour, standing under the short one', () => {
    const tall = obj('tall', 100, 130, 29, 70), short = obj('short', 132, 180, 24, 20);
    tall.scenarioData.observations = 'A tall cabinet.';
    short.scenarioData.observations = 'A box.';
    setRoom(tall, short);
    for (const [fx, fy] of [[137, 203], [135, 212], [145, 203]]) {
        assert.equal(pressE(fx, fy), 'short', `E at ${fx},${fy}`);
        assert.equal(labelAt(fx, fy), 'A box.', `label at ${fx},${fy}`);
    }
});


// tap-target's safe and cabinet (the 30px safe with its feet 5.5px above the cabinet's), seen from beside the safe:
// E picks the safe, and so must the label. A feet-only label (bd3c7f898) names the cabinet here.
test('the E label agrees with E beside the safe, facing left (tap-target geometry)', () => {
    const s = obj('safe', 108.5, 35.5, 24, 30), c = obj('cabinet', 79.5, 10.75, 29, 47);
    s.scenarioData.observations = 'A safe.';
    c.scenarioData.observations = 'A filing cabinet.';
    setRoom(s, c);
    assert.equal(pressE(140, 80, 'left'), 'safe');
    assert.equal(labelAt(140, 80, 'left'), 'A safe.');
});

// Seated at a desk (m02 it_department): the chair under the player scores aimDiff 0, so a label with no seat
// skip named the player's own chair while E (which skips the occupied seat) opened the mug.
test('E and the label both skip the seat the player is sitting on', () => {
    const chair = obj('chair', 130, 150, 24, 30, { scenarioData: { id: 'chair', observations: 'A hospital chair.' } });
    const mug = obj('mug', 118, 140, 12, 14, { scenarioData: { id: 'mug', observations: 'A mug.' } });
    setRoom(chair, mug);
    window.seating = { currentSeat: () => chair, isSeat: (o) => o === chair, standUp() {} };
    try {
        assert.equal(pressE(142, 170, 'up'), 'mug');
        assert.equal(labelAt(142, 170, 'up'), 'A mug.');
    } finally { delete window.seating; }
});

// Seated at a desk, E and the label prefer the desk's computer (interaction-reach.js isSeatedDeskPc). Gary's m02 desk:
// the chair under the player, his mug nearer the facing line than the PC, the PC a little off to one side.
const seatedAt = (chair) => { window.seating = { currentSeat: () => chair, isSeat: (o) => o === chair, standUp() {}, trySit: () => false }; };
const deskScene = (pcType = 'pc') => {
    const chair = obj('chair', 130, 150, 24, 30, { scenarioData: { id: 'chair', observations: 'A hospital chair.' } });
    const mug = obj('mug', 138, 138, 12, 14, { scenarioData: { id: 'mug', observations: 'A mug.' } });
    const pc = obj('pc', 124, 95, 34, 27, { scenarioData: { id: 'pc', type: pcType, observations: 'A workstation.' } });
    setRoom(chair, mug, pc);
    return chair;
};

test('seated with a PC in reach in front, E and the label pick the PC and not the nearer-aimed mug', () => {
    seatedAt(deskScene());
    try {
        assert.equal(pressE(142, 170, 'up'), 'pc');
        assert.equal(labelAt(142, 170, 'up'), 'A workstation.');
    } finally { delete window.seating; }
});

test('seated, a workstation or laptop counts as the desk computer too', () => {
    for (const t of ['workstation', 'laptop']) {
        seatedAt(deskScene(t));
        try {
            assert.equal(pressE(142, 170, 'up'), 'pc', t);
            assert.equal(labelAt(142, 170, 'up'), 'A workstation.', t);
        } finally { delete window.seating; }
    }
});

test('seated with no computer in reach keeps the old pick: the mug', () => {
    seatedAt(deskScene('mug_stand'));
    try {
        assert.equal(pressE(142, 170, 'up'), 'mug');
        assert.equal(labelAt(142, 170, 'up'), 'A mug.');
    } finally { delete window.seating; }
});

test('seated with the PC behind the chair keeps the old pick: that is another desk', () => {
    const chair = deskScene();
    seatedAt(chair);
    try {
        assert.equal(pressE(142, 170, 'down'), 'mug');   // facing down, away from the desk: the old pick
        assert.equal(labelAt(142, 170, 'down'), 'A mug.');
    } finally { delete window.seating; }
});

test('standing, nothing changes: the mug is picked and the label names it', () => {
    deskScene();
    delete window.seating;
    // not seated, so the chair is an ordinary object: the pick is what it was before the seated rule
    assert.equal(pressE(142, 170, 'up'), 'chair');
    assert.equal(labelAt(142, 170, 'up'), 'A hospital chair.');
});

test('seated, an NPC aimed better than the PC still wins; a worse-aimed one does not', () => {
    const chair = deskScene();
    const npc = (x, y) => ({ x, y, active: true, visible: true, _isNPC: true, npcId: 'n1', scenarioData: undefined });
    const room = globalThis.__testRooms.r;
    seatedAt(chair);
    try {
        room.npcSprites = [npc(142, 120)];            // dead ahead of the player, across the desk
        window.npcManager = { getNPC: () => ({ observations: 'A colleague.' }) };
        assert.equal(labelAt(142, 170, 'up'), 'A colleague.');
        room.npcSprites = [npc(190, 150)];            // off to the right
        assert.equal(labelAt(142, 170, 'up'), 'A workstation.');
        assert.equal(pressE(142, 170, 'up'), 'pc');
    } finally { delete window.seating; delete window.npcManager; delete room.npcSprites; }
});

// ---------------------------------------------------------------------------
// Review R1 (seated-E-prefers-PC): every reach check uses the same footprint reach, so the pick survives
// handleObjectInteraction's own range check (it used to log INTERACTION_OUT_OF_RANGE and do nothing), and the
// highlight and the tap reach agree.
// ---------------------------------------------------------------------------
// E from a chair, recording the pick only if handleObjectInteraction got past its range check
const pressESeated = (fx, fy, direction) => {
    picked.length = 0;
    const logs = [];
    globalThis.__pastRange = false;
    window.gameAlert = () => { globalThis.__pastRange = true; };   // the first thing a plain PC does after the range check
    const realLog = console.log;
    console.log = (...a) => { logs.push(String(a[0])); };
    window.player = standAt(fx, fy, direction);
    try { tryInteractWithNearest(); } finally { console.log = realLog; }
    return { id: picked[0], pastRange: globalThis.__pastRange, outOfRange: logs.includes('INTERACTION_OUT_OF_RANGE') };
};
const sideScene = (pcx, pcy) => {
    const chair = obj('chair', 130, 150, 24, 27, { scenarioData: { id: 'chair', observations: 'A hospital chair.' } });
    const pc = obj('pc', pcx, pcy, 24, 27, { scenarioData: { id: 'pc', type: 'pc', observations: 'A workstation.' } });
    setRoom(chair, pc);
    return chair;
};
for (const [dir, pcx, pcy] of [['left', 100, 99], ['right', 160, 99], ['up-left', 150, 99]]) {
    test(`seated facing ${dir}, a PC in footprint reach is opened and survives the range check`, () => {
        seatedAt(sideScene(pcx, pcy));
        try {
            const r = pressESeated(142, 170, dir);
            assert.equal(r.id, 'pc');
            assert.equal(r.outOfRange, false, 'handleObjectInteraction dropped the pick as out of range');
            assert.equal(r.pastRange, true, 'the interaction went on past the range check');
            assert.equal(labelAt(142, 170, dir), 'A workstation.');
        } finally { delete window.seating; }
    });
}

test('seated, the PC highlight and the tap reach use the same footprint reach as E', () => {
    seatedAt(sideScene(142, 99));
    try {
        const pc = globalThis.__testRooms.r.objects.pc;
        window.player = standAt(142, 170, 'up');
        assert.equal(isObjectInInteractionRange(pc), true, 'seated facing it: tap reach');
        window.player = standAt(142, 170, 'down');
        assert.equal(isObjectInInteractionRange(pc), false, 'seated facing away: plain reach');
        delete window.seating;
        window.player = standAt(142, 170, 'up');
        assert.equal(isObjectInInteractionRange(pc), false, 'standing: plain reach');
    } finally { delete window.seating; }
});

test('seated, mug > NPC > PC: an NPC aimed between the mug and the PC beats the PC; a worse-aimed one does not', () => {
    const chair = obj('chair', 130, 150, 24, 27, { scenarioData: { id: 'chair', observations: 'A hospital chair.' } });
    const mug = obj('mug', 140, 140, 6, 6, { scenarioData: { id: 'mug', observations: 'A mug.' } });        // about 2 degrees off
    const pc = obj('pc', 150, 99, 24, 27, { scenarioData: { id: 'pc', type: 'pc', observations: 'A workstation.' } });  // about 19 degrees off
    setRoom(chair, mug, pc);
    const room = globalThis.__testRooms.r;
    const npc = (x, y) => ({ x, y, active: true, visible: true, _isNPC: true, npcId: 'n1', scenarioData: undefined });
    seatedAt(chair);
    try {
        window.npcManager = { getNPC: () => ({ observations: 'A colleague.' }) };
        room.npcSprites = [npc(146, 120)];          // about 12 degrees off: between the mug and the PC
        assert.equal(labelAt(142, 170, 'up'), 'A colleague.', 'the NPC is better aimed than the PC although the mug scored best');
        room.npcSprites = [npc(165, 125)];          // about 59 degrees off
        assert.equal(labelAt(142, 170, 'up'), 'A workstation.', 'a worse-aimed NPC does not');
        assert.equal(pressESeated(142, 170, 'up').id, 'pc');
        delete room.npcSprites;
        assert.equal(labelAt(142, 170, 'up'), 'A workstation.', 'no NPC: the PC beats the mug');
    } finally { delete window.seating; delete window.npcManager; delete room.npcSprites; }
});

test('reachYSeated: a PC outside the front cone (player facing right, PC straight above) gains no footprint reach', () => {
    const pc = pcSprite({ x: 130, y: 60 });
    const p = { x: 130, y: 139, direction: 'right' };
    assert.equal(reachYSeated(pc, p, {}), reachY(pc, 139));
});

// ---------------------------------------------------------------------------
// interaction-reach.js directly
// ---------------------------------------------------------------------------
const pcSprite = (extra = {}) => ({ x: 100, y: 99, displayWidth: 24, displayHeight: 27, originX: 0, originY: 0, scenarioData: { id: 'pc', type: 'pc' }, ...extra });

test('reachYSeated: unseated is plain reachY', () => {
    const pc = pcSprite();
    assert.equal(reachYSeated(pc, { x: 112, y: 139, direction: 'up' }, null), reachY(pc, 139));
    assert.equal(reachYSeated(pc, { x: 112, y: 139, direction: 'up' }, undefined), reachY(pc, 139));
});

test('reachYSeated: seated, facing the PC, the player y is clamped into its vertical span', () => {
    const pc = pcSprite();
    const chair = {};
    assert.equal(reachYSeated(pc, { x: 112, y: 139, direction: 'up' }, chair), 126, 'below it: the bottom edge');
    assert.equal(reachYSeated(pc, { x: 112, y: 110, direction: 'up' }, chair), 110, 'level with it: unchanged');
    assert.equal(reachYSeated(pc, { x: 112, y: 60, direction: 'down' }, chair), 99, 'above it: the top edge');
});

test('reachYSeated: seated, a rotated PC, a non-finite y, a non-PC or a PC behind the player keep plain reachY', () => {
    const chair = {};
    const up = { x: 112, y: 139, direction: 'up' };
    assert.equal(reachYSeated(pcSprite({ rotation: 0.5 }), up, chair), reachY(pcSprite({ rotation: 0.5 }), 139));
    assert.equal(reachYSeated(pcSprite(), { x: 112, y: NaN, direction: 'up' }, chair), reachY(pcSprite(), NaN));
    const mug = pcSprite({ scenarioData: { id: 'm', type: 'mug' } });
    assert.equal(reachYSeated(mug, up, chair), reachY(mug, 139));
    assert.equal(reachYSeated(pcSprite(), { x: 112, y: 139, direction: 'down' }, chair), reachY(pcSprite(), 139), 'behind the player');
});

test('reachYSeated: a short and a tall PC both clamp to their own span', () => {
    const chair = {};
    const short = pcSprite({ displayHeight: 10 });
    const tall = pcSprite({ displayHeight: 40 });
    assert.equal(reachYSeated(short, { x: 112, y: 139, direction: 'up' }, chair), 109);
    assert.equal(reachYSeated(tall, { x: 112, y: 139, direction: 'up' }, chair), 139);
});

test('isSeatedDeskPc: seated only, PC types only, inside the cone and exactly at its edge', () => {
    const pc = pcSprite();
    const seat = {};
    assert.equal(isSeatedDeskPc(null, pc, 0), false, 'unseated');
    assert.equal(isSeatedDeskPc(seat, pc, 0), true);
    assert.equal(isSeatedDeskPc(seat, pc, SEATED_PC_FRONT_DEG), true, 'exactly at the cone edge');
    assert.equal(isSeatedDeskPc(seat, pc, SEATED_PC_FRONT_DEG + 0.01), false, 'just past it');
    assert.equal(isSeatedDeskPc(seat, pc, NaN), false);
    assert.equal(isSeatedDeskPc(seat, pcSprite({ scenarioData: { id: 'k', type: 'kiosk' } }), 0), false);
});

test('isDeskComputer: trailing digits are ignored and the terminal types count; kiosk, tablet and monitors do not', () => {
    const t = (type) => isDeskComputer(pcSprite({ scenarioData: { id: 'x', type } }));
    for (const ok of ['pc', 'pc3', 'pc10', 'laptop', 'laptop1', 'workstation', 'mail_terminal', 'log_filter_terminal', 'drug_library_terminal']) assert.equal(t(ok), true, ok);
    for (const no of ['kiosk', 'tablet', 'security_monitor', 'phone', 'server']) assert.equal(t(no), false, no);
    assert.equal(isDeskComputer(pcSprite({ _isNPC: true })), false);
    assert.equal(isDeskComputer(pcSprite({ doorProperties: {} })), false);
});

test('seatedPcWins: the PC loses only to a better-aimed NPC', () => {
    assert.equal(seatedPcWins(5000, Infinity), true, 'no NPC');
    assert.equal(seatedPcWins(5000, 4000), false, 'a better-aimed NPC');
    assert.equal(seatedPcWins(5000, 6000), true, 'a worse-aimed NPC');
    assert.equal(seatedPcWins(Infinity, Infinity), false, 'no PC');
});

// Review R2 m3: the label measures an NPC's reach as E does (isObjectInInteractionRange), so an NPC reachable only from
// his own chair edge (here a stubbed static-body reach, __reachSq) is named by the label and opened by E, not passed over.
test('seated, an NPC in reach only through his chair edge: the label and E pick the same target', () => {
    const chair = obj('chair', 130, 150, 24, 27, { scenarioData: { id: 'chair', observations: 'A hospital chair.' } });
    const pc = obj('pc', 150, 99, 24, 27, { scenarioData: { id: 'pc', type: 'pc', observations: 'A workstation.' } });  // about 19 degrees off
    setRoom(chair, pc);
    const room = globalThis.__testRooms.r;
    const npc = { x: 142, y: 90, active: true, visible: true, _isNPC: true, npcId: 'n1', scenarioData: undefined, __reachSq: 400 };  // 49 px away, dead ahead
    seatedAt(chair);
    try {
        window.npcManager = { getNPC: () => ({ observations: 'A colleague.' }) };
        room.npcSprites = [npc];
        let stoodUp = 0;
        window.seating.standUp = () => { stoodUp++; };
        assert.equal(labelAt(142, 170, 'up'), 'A colleague.', 'the label names the NPC E can reach');
        // E talks to him: no object picked and it did not fall through to standing up (tryInteractWithNPC is module-local)
        assert.equal(pressESeated(142, 170, 'up').id, undefined, 'E did not pick the PC');
        assert.equal(stoodUp, 0, 'E found a target');
        npc.__reachSq = 4000;                         // out of reach for both
        assert.equal(labelAt(142, 170, 'up'), 'A workstation.', 'out of reach: the PC');
        assert.equal(pressESeated(142, 170, 'up').id, 'pc');
    } finally { delete window.seating; delete window.npcManager; delete room.npcSprites; }
});

test('seated, an NPC who has just left this PC gives way to it in the label as in E', () => {
    const chair = obj('chair', 130, 150, 24, 27, { scenarioData: { id: 'chair', observations: 'A hospital chair.' } });
    const pc = obj('pc', 150, 99, 24, 27, { scenarioData: { id: 'pc', type: 'pc', observations: 'A workstation.' } });
    setRoom(chair, pc);
    const room = globalThis.__testRooms.r;
    const npc = { x: 146, y: 120, active: true, visible: true, _isNPC: true, npcId: 'n1', scenarioData: undefined, body: { velocity: { x: 50, y: 0 } } };
    seatedAt(chair);
    try {
        window.npcManager = { getNPC: () => ({ observations: 'A colleague.' }) };
        room.npcSprites = [npc];
        assert.equal(labelAt(142, 170, 'up'), 'A colleague.', 'no record of him leaving: better aimed than the PC');
        window.workstationState = { leftBy: (id, who) => id === 'pc' && who === 'n1' };
        assert.equal(labelAt(142, 170, 'up'), 'A workstation.', 'on the move from this PC: the PC');
        assert.equal(pressESeated(142, 170, 'up').id, 'pc');
    } finally { delete window.seating; delete window.npcManager; delete window.workstationState; delete room.npcSprites; }
});
