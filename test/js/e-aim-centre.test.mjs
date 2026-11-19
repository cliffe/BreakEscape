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
import { aimX, aimY, aimDiff, BODY_AIM_MAX_PX } from '../../public/break_escape/js/systems/interaction-reach.js';
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
    './npc-reach.js': 'export function npcReachDistSq(p, s, d){return d;}',
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
const { tryInteractWithNearest } = await import(pathToFileURL(join(dir, 'interactions.mjs')).href);

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
writeFileSync(join(ldir, 'info-label.js'), readFileSync(join(js, 'ui/info-label.js'), 'utf8')
    .replace("'../utils/constants.js'", "'./constants.js'")
    .replace("'../utils/conditional-text.js'", "'./conditional-text.js'")
    .replace("'../utils/display-dashes.js'", "'./display-dashes.js'")
    .replace("'../utils/pc-observations.js'", "'./pc-observations.js'")
    .replace("'../systems/interaction-walls.js'", "'./walls.js'")
    .replace("'../systems/interaction-reach.js'", "'./reach.js'"));
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
