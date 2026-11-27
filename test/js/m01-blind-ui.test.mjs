// m01 blind playtest, item 4 (lock minigame and field guide):
// - 4a: a player who holds keys but none that fit the lock, and who holds a lockpick,
//   opens straight in lockpicking mode (anyKeyMightFitLock in systems/lockpick-catch.js,
//   used by systems/unlock-system.js);
// - 4b: the in-game lab sheet popup always asks for ?embedded so the sheet's authoring
//   metadata (description, licence, empty Tags) stays hidden (utils/lab-workstation.js).
// Run with: node --max-old-space-size=2048 test/js/m01-blind-ui.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'm01-blind-ui-'));
const copy = (src, out, rewrites = []) => {
    let code = readFileSync(join(js, src), 'utf8');
    for (const [a, b] of rewrites) code = code.replace(a, b);
    writeFileSync(join(dir, out), code);
    return pathToFileURL(join(dir, out)).href;
};
globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { getElementById: () => null };
copy('utils/key-cut-calculator.js', 'key-cut-calculator.mjs');
const { anyKeyMightFitLock } = await import(copy('systems/lockpick-catch.js', 'lockpick-catch.mjs', [["'../utils/key-cut-calculator.js'", "'./key-cut-calculator.mjs'"]]));
const labMod = await import(copy('utils/lab-workstation.js', 'lab-workstation.mjs'));

const key = (keyPins) => ({ scenarioData: { type: 'key', keyPins } });
const derekLock = [35, 55, 45, 25];

test('m01 Derek door: only the Main Office Key held, so no key fits', () => {
    assert.equal(anyKeyMightFitLock([key([45, 25, 55, 35])], derekLock), false);
});
test('the matching key (within 5px) fits', () => {
    assert.equal(anyKeyMightFitLock([key([45, 25, 55, 35]), key([35, 55, 45, 25])], derekLock), true);
    assert.equal(anyKeyMightFitLock([key([38, 52, 45, 25])], derekLock), true);
});
test('a key with explicit cuts is compared as pin - 20', () => {
    assert.equal(anyKeyMightFitLock([{ scenarioData: { cuts: [15, 35, 25, 5] } }], derekLock), true);
    assert.equal(anyKeyMightFitLock([{ scenarioData: { cuts: [25, 5, 35, 15] } }], derekLock), false);
});
test('unknowns stay in key mode: key without data, lock without pins', () => {
    assert.equal(anyKeyMightFitLock([{ scenarioData: { type: 'key' } }], derekLock), true);
    assert.equal(anyKeyMightFitLock([key([1, 2, 3, 4])], undefined), true);
    assert.equal(anyKeyMightFitLock([], derekLock), false);
});

test('withEmbeddedParam adds embedded to a lab URL, keeping query and hash', () => {
    const f = labMod.withEmbeddedParam;
    assert.equal(f('https://x.test/labs/safetynet/lockpicking/'), 'https://x.test/labs/safetynet/lockpicking/?embedded=1');
    assert.equal(f('https://x.test/a/?v=2'), 'https://x.test/a/?v=2&embedded=1');
    assert.equal(f('https://x.test/a/#top'), 'https://x.test/a/?embedded=1#top');
    assert.equal(f('https://x.test/a/?embedded'), 'https://x.test/a/?embedded');
    assert.equal(f('https://x.test/a/?x=1&embedded=1'), 'https://x.test/a/?x=1&embedded=1');
});

test('openLabWorkstation loads the embedded URL into the frame', () => {
    const frame = { src: '' };
    const popup = { style: {} };
    globalThis.document = { getElementById: (id) => (id === 'lab-popup' ? popup : id === 'lab-frame' ? frame : null) };
    labMod.openLabWorkstation('https://x.test/labs/safetynet/lockpicking/');
    assert.equal(frame.src, 'https://x.test/labs/safetynet/lockpicking/?embedded=1');
    assert.equal(popup.style.display, 'block');
});

test('"Open in new tab" opens the page without the embedded param', () => {
    const f = labMod.withoutEmbeddedParam;
    assert.equal(f('https://x.test/a/?embedded=1'), 'https://x.test/a/');
    assert.equal(f('https://x.test/a/?v=2&embedded=1#top'), 'https://x.test/a/?v=2#top');
    assert.equal(f('https://x.test/a/?embedded=1&v=2'), 'https://x.test/a/?v=2');
    assert.equal(f('https://x.test/a/'), 'https://x.test/a/');
    const opened = [];
    globalThis.window = { open: (u, t) => opened.push([u, t]), gameState: { globalVariables: {} } };
    globalThis.document = { getElementById: (id) => (id === 'lab-frame' ? { src: 'https://x.test/a/?embedded=1' } : null) };
    labMod.openLabWorkstationInNewTab();
    assert.deepEqual(opened, [['https://x.test/a/', '_blank']]);
});
