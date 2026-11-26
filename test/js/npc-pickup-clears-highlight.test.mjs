// A highlighted world item that an NPC picks up (npc-needs pickUp, or a stow) leaves rooms[*].objects, so
// the per-frame highlight loop never ends its highlight: the blue tint (0x4da6ff) and the depth-9000
// proximity ghost stayed on screen until the item was consumed (ca15_shadow_it, a dropped USB stick).
// pickUp now calls interactions.js clearHighlight (via window.clearObjectHighlight).
// Run with: node test/js/npc-pickup-clears-highlight.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'pickup-highlight-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));

// Copy a module with every relative import replaced by a stub that exports each imported name as a no-op
// (overrides give the few the code reads), so only the module's own logic runs.
let n = 0;
function load(rel, overrides = {}) {
    let src = readFileSync(join(js, rel), 'utf8');
    src = src.replace(/^import\s+([\s\S]*?)\s+from\s+'(\.[^']+)';?$/gm, (_, clause, from) => {
        const file = `stub${++n}.mjs`;
        const ns = clause.match(/^\*\s+as\s+(\w+)$/);
        const names = ns ? [] : [...clause.matchAll(/(\w+)(?:\s+as\s+(\w+))?/g)].map(m => m[1]).filter(x => x !== 'as');
        const body = names.map(name => (name in overrides
            ? `export const ${name} = globalThis.__ov.${name};`
            : `export const ${name} = class { static x = 1 };`)).join('\n');
        writeFileSync(join(dir, file), ns ? 'export const x = 1;' : body);
        return ns ? `import * as ${ns[1]} from './${file}';` : `import { ${names.join(', ')} } from './${file}';`;
    });
    src = src.replace(/^export \{ inventoryMenuFor \};$/m, '');
    const out = `mod${++n}.mjs`;
    writeFileSync(join(dir, out), src);
    return import(pathToFileURL(join(dir, out)).href);
}

globalThis.window = { eventDispatcher: { on() {}, emit() {} } };
globalThis.performance ??= { now: () => Date.now() };
const rooms = { lab: { objects: {} } };
globalThis.__ov = {
    INTERACTION_RANGE: 32, INTERACTION_RANGE_SQ: 1024, INTERACTION_CHECK_INTERVAL: 0, DOOR_INTERACTION_RANGE_SQ: 4096, overlayDepth: () => 0,
    rooms,
    interactionLineClear: () => true,
    reachX: (o) => o.x, reachYSeated: (o) => o.y, npcReachDistSq: (p, o, d) => d, seatedNpcReachDistSq: (p, o, d) => d,
    hasTriggerOnInteract: () => false, isDroppableInventoryItem: () => false, inventoryMenuFor: () => null
};
const interactions = await load('systems/interactions.js', globalThis.__ov);

import { createEngineWorld } from '../../public/break_escape/js/systems/npc-needs.js';

const HIGHLIGHT = 0x4da6ff;
function makeScene(ghosts) {
    return { add: { image: () => {
        const g = { destroyed: false, setOrigin() { return g; }, setScale() { return g; }, setAngle() { return g; }, setDepth(d) { g.depth = d; return g; },
            setTint() { return g; }, setAlpha() { return g; }, destroy() { g.destroyed = true; } };
        ghosts.push(g); return g;
    } }, tweens: { add() {} } };
}
function stick(ghosts) {
    const s = {
        objectId: 'usb', scenarioData: { id: 'usb', type: 'usb_storage_swivel', name: 'USB stick' }, roomId: 'lab',
        active: true, visible: true, interactable: true, x: 10, y: 10, displayWidth: 16, displayHeight: 16, isHighlighted: false, tintTopLeft: 0xffffff,
        texture: { key: 'usb_storage_swivel' }, frame: { name: 0 }, scaleX: 1, scaleY: 1,
        scene: makeScene(ghosts),
        get isTinted() { return this.tintTopLeft !== 0xffffff; },
        setTint(c) { this.tintTopLeft = c; }, clearTint() { this.tintTopLeft = 0xffffff; },
        setVisible(v) { this.visible = v; }, setInteractive() {}, disableInteractive() {}, setDepth() {}, destroy() { this.destroyed = true; }
    };
    return s;
}
function setup() {
    const ghosts = [];
    const sp = stick(ghosts);
    rooms.lab.objects = { usb: sp };
    Object.assign(window, {
        gameScenario: { officeVisuals: true }, rooms,
        npcManager: { getNPC: () => ({ id: 'joanne', itemsHeld: [] }) },
        npcBehaviorManager: { getBehavior: () => ({ sprite: { body: { center: { x: 50, y: 60 } }, destroyed: false }, roomId: 'lab' }) },
        eventDispatcher: { emit() {} }, stateSync: { requestSoon() {} },
        RoomStateSync: { carryObject: () => Promise.resolve(true), putDownObject: () => Promise.resolve(true) }
    });
    return { sp, ghosts };
}
function highlight(sp) {
    window.player = { direction: 'down', x: 10, y: 10 };
    window.seating = undefined;
    interactions.checkObjectInteractions.call({});
}

test('a highlighted sprite picked up by an NPC ends with no tint, no ghost, isHighlighted false', () => {
    const { sp, ghosts } = setup();
    highlight(sp);
    assert.equal(sp.tintTopLeft, HIGHLIGHT, 'precondition: highlighted');
    assert.ok(sp.proximityGhost, 'precondition: ghost present');
    assert.equal(createEngineWorld().pickUp('joanne', 'usb'), true);
    assert.equal(sp.isTinted, false);
    assert.equal(sp.proximityGhost, undefined);
    assert.equal(ghosts.length, 1);
    assert.equal(ghosts[0].destroyed, true, 'ghost destroyed');
    assert.equal(sp.isHighlighted, false);
    assert.equal(sp._preGhostSetVisible, undefined, 'setVisible patch removed');
    assert.equal(sp.visible, true, 'still visible in the carrier hand');
});

test('clearHighlight also destroys the interaction indicator and is safe on an unhighlighted sprite', () => {
    const { sp } = setup();
    let gone = false;
    sp.isHighlighted = true; sp.tintTopLeft = HIGHLIGHT; sp.interactionIndicator = { destroy() { gone = true; } };
    interactions.clearHighlight(sp);
    assert.equal(gone, true);
    assert.equal(sp.interactionIndicator, undefined);
    assert.equal(sp.isTinted, false);
    interactions.clearHighlight(sp);
    interactions.clearHighlight(null);
});
