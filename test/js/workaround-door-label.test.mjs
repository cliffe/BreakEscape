// Review 9.2 B R2 m5 and n5, client side.
//  m5: doors.js emits door_opened with restored: true only for a sprite the workaround runner
//      marked proppedOpening (a propped door re-opened after a reload); an in-session open has
//      no restored key at all.
//  n5: the proximity label (ui/info-label.js) hands the object's scenarioData.id, not the
//      sprite's own id or name, to postitMarks.label, and shows what it returns.
// Run with: node test/js/workaround-door-label.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');

// ---- m5: the real doors.js open path (unlockDoor -> openDoor) ----
globalThis.window = {};
const { unlockDoor } = await import(pathToFileURL(join(js, 'systems/doors.js')));

function openADoor(extra = {}) {
    const events = [];
    window.eventDispatcher = { emit: (n, d) => events.push([n, d]) };
    window.game = { scene: { isActive: () => true } };
    window.rooms = { lobby: { doorSprites: [] }, vault: { doorSprites: [] } };   // connected room already loaded
    window.roomPositions = {};
    window.gameScenario = { rooms: {} };
    window.pathfindingManager = null;
    const sprite = {
        x: 100, y: 100, body: { enable: true }, scene: null,
        setActive() {}, destroy() {},
        doorProperties: { roomId: 'lobby', connectedRoom: 'vault', direction: 'north', worldX: 100, worldY: 100, locked: true },
        ...extra
    };
    unlockDoor(sprite, null);
    return events.filter(e => e[0] === 'door_opened').map(e => e[1]);
}

test('a propped door re-opened by the workaround runner emits door_opened with restored: true', () => {
    const opened = openADoor({ proppedOpening: true });
    assert.equal(opened.length, 1);
    assert.equal(opened[0].restored, true);
    assert.equal(opened[0].roomId, 'lobby');
    assert.equal(opened[0].connectedRoom, 'vault');
});

test('a door opened in the session emits door_opened with no restored key', () => {
    const opened = openADoor();
    assert.equal(opened.length, 1);
    assert.equal('restored' in opened[0], false);
});

// ---- n5: the proximity label passes the scenario id ----
const dir = mkdtempSync(join(tmpdir(), 'wdl-label-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
writeFileSync(join(dir, 'constants.js'), 'export const INTERACTION_RANGE = 64; export const INTERACTION_RANGE_SQ = 64 * 64;');
writeFileSync(join(dir, 'conditional-text.js'),
    'export function resolveObjectField(data, field, fallback) { const v = data && data[field]; return typeof v === "function" ? v() : (v || fallback); }');
writeFileSync(join(dir, 'display-dashes.js'), 'export const displayDashes = t => t;');
writeFileSync(join(dir, 'walls.js'), 'export const interactionLineClear = () => true;');
writeFileSync(join(dir, 'reach.js'), 'export const reachX = o => o.x; export const aimX = o => o.x;');
writeFileSync(join(dir, 'info-label.js'), readFileSync(join(js, 'ui/info-label.js'), 'utf8')
    .replace("'../utils/constants.js'", "'./constants.js'")
    .replace("'../utils/conditional-text.js'", "'./conditional-text.js'")
    .replace("'../utils/display-dashes.js'", "'./display-dashes.js'")
    .replace("'../systems/interaction-walls.js'", "'./walls.js'")
    .replace("'../systems/interaction-reach.js'", "'./reach.js'"));

const classes = new Set();
const label = { id: 'hud-info-label', textContent: '', setAttribute() {},
    classList: { add: c => classes.add(c), remove: c => classes.delete(c) } };
let created = null;
globalThis.document = {
    getElementById: () => created,
    createElement: () => label,
    body: { appendChild: el => { created = el; } },
};
let clock = 0;
globalThis.performance = { now: () => clock };
const { createInfoLabel, updateInfoLabel } = await import(pathToFileURL(join(dir, 'info-label.js')));
createInfoLabel();

test('the label path passes scenarioData.id to postitMarks.label and shows the text it returns', () => {
    const calls = [];
    window.postitMarks = { label: (id, text) => { calls.push([id, text]); return `${text} (note)`; } };
    const pc = { x: 300, y: 300, id: 'sprite_internal_7', name: 'sprite_name_pc', active: true, interactable: true, visible: true,
        scenarioData: { id: 'chris_pc', observations: "Chris's PC." } };
    window.rooms = { office: { objects: { pc } } };
    window.player = { x: 300, y: 330, direction: 'up' };
    clock += 150;
    updateInfoLabel();
    assert.deepEqual(calls[0], ['chris_pc', "Chris's PC."]);
    assert.ok(calls.every(c => c[0] === 'chris_pc'));
    assert.equal(label.textContent, "Chris's PC. (note)");
});
