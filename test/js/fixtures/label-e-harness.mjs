// Loads the real interactions.js (E) and the real info-label.js (the E label) against stubs, over one shared
// rooms map, so a test can press E and read the label from the same stance. EPICK_OLD names an older
// interactions.js to load instead (to record what E picked before a change). Used by
// e-pick-fixtures.test.mjs and label-e-agree.test.mjs.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

export async function loadHarness({ oldInteractions = process.env.EPICK_OLD, oldLabel = process.env.EPICK_OLD_LABEL } = {}) {
    const dir = mkdtempSync(join(tmpdir(), 'label-e-'));
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
    const reachSrc = readFileSync(join(js, 'systems/interaction-reach.js'), 'utf8');
    const npcReach = 'export function npcReachDistSq(p, s, d){return s.__reachSq ?? d;}';
    const stubs = {
        '../utils/constants.js': 'export const INTERACTION_RANGE=32, INTERACTION_RANGE_SQ=1024, INTERACTION_CHECK_INTERVAL=0, DOOR_INTERACTION_RANGE_SQ=0; export function overlayDepth(){return 0;}',
        '../core/rooms.js': 'export const rooms = (globalThis.__testRooms = {});',
        '../core/player.js': 'export function facePlayerToward(x, y){ (globalThis.__faceCalls ||= []).push([x, y]); }',
        './unlock-system.js': 'export function handleUnlock(){}',
        './doors.js': 'export function handleDoorInteraction(d){ (globalThis.__doorPicks ||= []).push(d.id); }',
        './biometrics.js': 'export function collectFingerprint(){} export function handleBiometricScan(){}',
        './inventory.js': 'export function addToInventory(){return true;} export function createItemIdentifier(){return "";}',
        './ui-sounds.js': 'export function playUISound(){} export function playGameSound(){}',
        './apply-actions.js': 'export function applyActions(){}',
        '../utils/conditional-text.js': 'export function resolveObjectField(obj,key){ return obj ? obj[key] : undefined; }',
        '../utils/flag-lock.js': 'export function isRemoteFlagLock(){return false;} export function remoteFlagLockMessage(){return "";}',
        './npc-reach.js': npcReach,
        './examine.js': 'export function shouldExamine(){return false;} export function startExamine(){return false;}',
        './combat-input.js': 'export function showPastTalkingToast(){}',
        './consumables.js': 'export function shouldConsumeOnInteract(){return false;} export function useConsumable(){}',
        './interaction-walls.js': 'export function interactionLineClear(p, t){return !(t && t.__blocked);}',
        '../utils/locked-hint.js': 'export function hintToastMs(){ return 6000; }',
        './requires-item-hint.js': 'export function requiresItemHint(){ return ""; }',
        './pc-policy.js': readFileSync(join(js, 'systems/pc-policy.js'), 'utf8'),
        './interaction-reach.js': reachSrc,
        './minigame-registry.js': 'export function hasMinigameStarter(){return false;} export function startRegisteredMinigame(){}',
        '../utils/display-dashes.js': 'export function displayDashes(s){ return s; }',
        '../utils/escape-html.js': 'export function escapeHtml(s){ return String(s ?? ""); }',
        './inventory-menu.js': 'export function hasTriggerOnInteract(){return false;} export function isDroppableInventoryItem(){return false;} export function dropInventoryItem(){} export function inventoryMenuFor(){return null;}',
    };
    let src = readFileSync(oldInteractions || join(js, 'systems/interactions.js'), 'utf8');
    for (const [spec, body] of Object.entries(stubs)) {
        src = src.split(`'${spec}'`).join(`'${dataUrl(body)}'`);
    }
    writeFileSync(join(dir, 'interactions.mjs'), src);
    globalThis.window = {};

    // The label, against the same real reach file and the same NPC reach stub
    writeFileSync(join(dir, 'constants.js'), 'export const INTERACTION_RANGE = 32; export const INTERACTION_RANGE_SQ = 32 * 32;');
    writeFileSync(join(dir, 'conditional-text.js'),
        'export function resolveObjectField(data, field, fallback) { const v = data && data[field]; return typeof v === "function" ? v() : (v || fallback); }');
    writeFileSync(join(dir, 'display-dashes.js'), 'export const displayDashes = t => t;');
    writeFileSync(join(dir, 'computer-keywords.js'), readFileSync(join(js, 'utils/computer-keywords.js'), 'utf8'));
    writeFileSync(join(dir, 'pc-observations.js'), readFileSync(join(js, 'utils/pc-observations.js'), 'utf8'));
    writeFileSync(join(dir, 'walls.js'), 'export const interactionLineClear = (p, t) => !(t && t.__blocked);');
    writeFileSync(join(dir, 'reach.js'), reachSrc);
    writeFileSync(join(dir, 'npc-reach.js'), npcReach);
    writeFileSync(join(dir, 'info-label.js'), readFileSync(oldLabel || join(js, 'ui/info-label.js'), 'utf8')
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
    const { tryInteractWithNearest } = await import(pathToFileURL(join(dir, 'interactions.mjs')).href);
    const { createInfoLabel, updateInfoLabel } = await import(pathToFileURL(join(dir, 'info-label.js')).href);
    createInfoLabel();

    const picked = [];
    window.playerPoses = { use: (s) => picked.push(s.scenarioData?.id ?? s.npcId ?? '?') };
    window.rooms = globalThis.__testRooms;

    // The player's sprite sits 31 px above the feet; body.center is the feet (footOf)
    const standAt = (fx, fy, direction = 'up') => ({ x: fx, y: fy - 31, direction, body: { center: { x: fx, y: fy } } });
    const setRooms = (rooms) => {
        for (const k of Object.keys(globalThis.__testRooms)) delete globalThis.__testRooms[k];
        Object.assign(globalThis.__testRooms, rooms);
    };
    /** E from a stance: the id of what it acted on ('door:<id>' for a door, the npcId for an NPC), or null. */
    const pressE = (fx, fy, direction = 'up') => {
        picked.length = 0;
        globalThis.__doorPicks = [];
        window.player = standAt(fx, fy, direction);
        let stoodUp = 0;
        if (window.seating) window.seating.standUp = () => { stoodUp++; };
        const log = console.log, warn = console.warn, err = console.error;
        console.log = console.warn = console.error = () => {};
        try { tryInteractWithNearest(); } catch (e) { /* the handler runs on stubs; only the pick matters */ } finally { console.log = log; console.warn = warn; console.error = err; }
        if (globalThis.__doorPicks.length) return 'door:' + globalThis.__doorPicks[0];
        if (picked.length) return picked[0];
        return stoodUp ? 'stand' : null;
    };
    /** The label from a stance: its text, or null when hidden. */
    const labelAt = (fx, fy, direction = 'up') => {
        window.rooms = globalThis.__testRooms;
        window.player = standAt(fx, fy, direction);
        clock += 150;
        updateInfoLabel();
        return classes.has('visible') ? label.textContent : null;
    };
    return { pressE, labelAt, setRooms, standAt };
}

// ---- scene builders ------------------------------------------------------------------------------------
export const obj = (id, x, y, w, h, extra = {}) => ({ x, y, width: w, height: h, displayWidth: w, displayHeight: h, originX: 0, originY: 0,
    active: true, interactable: true, visible: true, ...extra, scenarioData: { id, observations: 'obs ' + id, ...(extra.scenarioData || {}) } });
export const npc = (id, x, y, extra = {}) => ({ x, y, active: true, visible: true, _isNPC: true, npcId: id, scenarioData: undefined, ...extra });
export const door = (id, x, y, direction = 'north') => ({ id, x, y, active: true, doorProperties: { direction, door_sign: 'door ' + id } });

/** window.seating for a player sitting on `chair` (or standing, when null); every object with .seat is a seat. */
export function seatingFor(chair) {
    window.seating = { currentSeat: () => chair, isSeat: (o) => !!o.seat, standUp() {}, trySit: () => false };
}

/** Make an NPC sit on `chair` (its behaviour holds the chair; the chair holds the npc id). */
export function seatNpc(sprite, chair, places = null, place = 0) {
    if (!places) chair.seatedBy = sprite.npcId;   // a sofa holds its sitters in _places, and reads 'full' only when every place is taken
    const seat = { chair, seat: { places }, place };
    const prev = window.npcBehaviorManager?.map || {};
    prev[sprite.npcId] = { _seat: seat };
    window.npcBehaviorManager = { map: prev, getBehavior: (id) => prev[id] };
}
