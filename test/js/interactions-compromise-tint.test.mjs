// Ops core S3 (OPS_CORE_PLAN.md 5.4, 11.3): a sprite carrying a compromise mark (sprite.compromiseTint,
// set by systems/compromise-marks.js) rests at the mark's red when a highlight ends, in interactions.js
// (leaving range, leaving the viewport, interactable turning false) and in the fingerprint kit's
// clearHighlights; an unmarked sprite ends with no tint, as before. Putting clearTint back for restTint
// fails these tests.
// Run with: node test/js/interactions-compromise-tint.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'interactions-tint-'));
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

const HIGHLIGHT = 0x4da6ff;
const RED = 0xff8a8a;
function sprite(id, { marked = false } = {}) {
    const s = {
        active: true, interactable: true, x: 0, y: 0, isHighlighted: false, tintTopLeft: 0xffffff, scenarioData: { id },
        get isTinted() { return this.tintTopLeft !== 0xffffff; },
        setTint(c) { this.tintTopLeft = c; },
        clearTint() { this.tintTopLeft = 0xffffff; },
        setVisible() {}, destroy() {}
    };
    if (marked) { s.compromiseTint = RED; s.tintTopLeft = RED; }
    return s;
}
function tick(player) {
    window.player = { direction: 'down', ...player };
    window.seating = undefined;
    interactions.checkObjectInteractions.call({});
}
const near = { x: 0, y: 0 };
const far = { x: 900, y: 900 };

test('a marked sprite walked into range shows the highlight blue and walked out shows the mark\'s red again; an unmarked one ends with no tint', () => {
    const marked = sprite('m', { marked: true });
    const plain = sprite('p');
    rooms.lab.objects = { m: marked, p: plain };
    tick(near);
    assert.equal(marked.tintTopLeft, HIGHLIGHT);
    assert.equal(plain.tintTopLeft, HIGHLIGHT);
    tick(far);
    assert.equal(marked.tintTopLeft, RED);
    assert.equal(plain.tintTopLeft, 0xffffff, 'an unmarked sprite is not tinted once the hover ends');
    assert.equal(marked.isHighlighted, false);
});

test('the same when interactable turns false while highlighted', () => {
    const marked = sprite('m', { marked: true });
    const plain = sprite('p');
    rooms.lab.objects = { m: marked, p: plain };
    tick(near);
    marked.interactable = false; plain.interactable = false;
    tick(near);
    assert.equal(marked.tintTopLeft, RED);
    assert.equal(plain.tintTopLeft, 0xffffff);
});

test('the same when the sprite leaves the viewport while highlighted', () => {
    const marked = sprite('m', { marked: true });
    const plain = sprite('p');
    rooms.lab.objects = { m: marked, p: plain };
    tick(near);
    interactions.setGameInstance({ cameras: { main: { scrollX: 5000, scrollY: 5000, width: 100, height: 100 } } });
    tick(near);
    interactions.setGameInstance(null);
    assert.equal(marked.tintTopLeft, RED);
    assert.equal(plain.tintTopLeft, 0xffffff);
});

test('a mark that ends while the sprite is highlighted leaves no red once the hover ends', () => {
    const marked = sprite('m', { marked: true });
    rooms.lab.objects = { m: marked };
    tick(near);
    delete marked.compromiseTint;   // compromise-marks.js removes the property at once
    tick(far);
    assert.equal(marked.tintTopLeft, 0xffffff);
});

test('the fingerprint kit\'s clearHighlights leaves the mark\'s red on a marked sprite and clears an unmarked one', async () => {
    const mod = await load('minigames/biometrics/biometrics-minigame.js', {});
    const marked = sprite('m', { marked: true });
    const plain = sprite('p');
    marked.tintTopLeft = 0xff0000; plain.tintTopLeft = 0xff0000;   // the view's own highlight
    const self = Object.create(mod.BiometricsMinigame.prototype);
    self.highlightedObjects = [marked, plain];
    self.clearHighlights();
    assert.equal(marked.tintTopLeft, RED);
    assert.equal(plain.tintTopLeft, 0xffffff);
    assert.deepEqual(self.highlightedObjects, []);
});
