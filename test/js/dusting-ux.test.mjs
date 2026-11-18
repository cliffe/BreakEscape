// Dusting UX: the find-step print patch is findable with High contrast and Hint off (raised sheen
// plus a dotted floor), High contrast raises it further; closing the compare screen without
// "Log the print" toasts "Print logged", the button path does not toast twice.
// Run with: node --test test/js/dusting-ux.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '../../public/break_escape');
const root = mkdtempSync(join(tmpdir(), 'dusting-ux-'));
cpSync(join(pub, 'js'), join(root, 'js'), { recursive: true });
writeFileSync(join(root, 'package.json'), '{"type":"module"}');

const el = () => ({ setAttribute() {}, appendChild() {}, style: {} });
globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { getElementById: () => null, createElement: el, head: { appendChild() {} }, body: { appendChild() {} } };
globalThis.Image = class {};
const model = await import(pathToFileURL(join(root, 'js/minigames/dusting/dusting-model.js')).href);
const { DustingMinigame } = await import(pathToFileURL(join(root, 'js/minigames/dusting/dusting-game.js')).href);
const { DIFFICULTY, findSheen } = model;

const base = { lit: 0, ridge: 1, mask: 1, res: 1, dotted: true, hc: false };

test('every difficulty shows a dotted floor without the torch, easy strongest', () => {
    const f = d => findSheen({ ...base, floor: DIFFICULTY[d].findFloor });
    assert.ok(f('hard') >= 0.1, 'hard floor is above 0.1');
    assert.ok(f('medium') > f('hard'));
    assert.ok(f('easy') > f('medium'));
    assert.ok(f('easy') <= 0.3, 'floor stays a hint, not a giveaway');
});

test('the floor is dotted: off-pattern pixels show nothing without the torch', () => {
    assert.equal(findSheen({ ...base, dotted: false, floor: 0.16 }), 0);
});

test('the floor never shows outside the print mask', () => {
    assert.equal(findSheen({ ...base, mask: 0, floor: 0.16 }), 0);
});

test('the torch sheen is full strength well before the beam centre', () => {
    // before: ridge*mask*res*lit*0.8 gave 0.4 at half beam; now it must beat that clearly
    assert.ok(findSheen({ ...base, lit: 0.5, floor: 0.1 }) >= 0.75);
    assert.equal(findSheen({ ...base, lit: 1, floor: 0.1 }), 1);
});

test('high contrast raises both the floor and the sheen', () => {
    const f = DIFFICULTY.medium.findFloor;
    assert.ok(findSheen({ ...base, hc: true, floor: f }) > findSheen({ ...base, floor: f }));
    const weak = { ...base, lit: 0.3, ridge: 0.5, res: 0.9, dotted: false, floor: f };
    assert.ok(findSheen({ ...weak, hc: true }) > findSheen(weak));
});

// ---- close toast

function compareGame({ identified }) {
    const g = Object.create(DustingMinigame.prototype);
    Object.assign(g, {
        mounted: true, final: { quality: 0.8, rating: 'good' }, _resultSent: false, identified,
        print: { pattern: 'loop' }, surfaceId: 'glass', powder: 'black', objectId: 'o1', ownerName: 'X',
        gameResult: null
    });
    g._buildResult = () => ({ identified: g.identified === true });
    return g;
}
let toasts;
const calls = [];
const { MinigameScene } = await import(pathToFileURL(join(root, 'js/minigames/framework/base-minigame.js')).href);
MinigameScene.prototype.complete = function (s) { calls.push(s); };

test('closing without Log the print toasts "Print logged" once and still records the print', () => {
    toasts = []; calls.length = 0; globalThis.window.showNotification = (...a) => toasts.push(a);
    const g = compareGame({ identified: true });
    g.complete(false);
    assert.equal(toasts.length, 1);
    assert.equal(toasts[0][0], 'Print logged');
    assert.equal(toasts[0][1], 'success');
    assert.deepEqual(calls, [true]);
    assert.equal(g.gameResult.identified, true);
    g.complete(false); // a second close call must not toast again
    assert.equal(toasts.length, 1);
});

test('the Log the print button path does not toast on the close that follows', () => {
    toasts = []; calls.length = 0; globalThis.window.showNotification = (...a) => toasts.push(a);
    const g = compareGame({ identified: true });
    g._finish();
    g.complete(false);
    assert.equal(toasts.length, 0);
});

test('closing before the peel is a plain cancel with no toast', () => {
    toasts = []; calls.length = 0; globalThis.window.showNotification = (...a) => toasts.push(a);
    const g = compareGame({ identified: true });
    g.mounted = false;
    g.complete(false);
    assert.equal(toasts.length, 0);
});
