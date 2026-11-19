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
import { aimX, aimY } from '../../public/break_escape/js/systems/interaction-reach.js';

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
let src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
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

test('E: a board above a desk is still picked when the player faces it and nothing nearer is in front', () => {
    const desk = obj('desk', 100, 100, 100, 50);
    const board = obj('board', 120, 58, 60, 30, { scenarioData: { id: 'board', wallMounted: true } });
    setRoom(desk, board);
    assert.ok(['board', 'desk'].includes(pressE(150, 150)));   // either is a fair pick; the point is that it picks
});

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
const labelAt = (fx, fy) => {
    window.rooms = globalThis.__testRooms;
    window.player = standAt(fx, fy);
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
