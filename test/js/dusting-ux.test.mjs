// Dusting UX: the find-step print patch is findable with High contrast and Hint off (raised sheen
// plus a dotted floor), High contrast raises it further; closing the compare screen without
// "Log the print" gives one toast titled "Print Logged"; the button path keeps "Print Lifted".
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
const { DIFFICULTY, SURFACES, findSheen, findGlint, findFloorScale } = model;
const { foggyCoach } = await import(pathToFileURL(join(root, 'js/minigames/dusting/dusting-game.js')).href);
const { startDustingMinigame } = await import(pathToFileURL(join(root, 'js/systems/biometrics.js')).href);

const base = { lit: 0, ridge: 1, mask: 1, res: 1, dotted: true, hc: false };

const hex = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
const luma = c => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];

// Luma change of one floor pixel on an unlit surface (drawn at half brightness), as _drawFind computes it.
function floorDelta(colourHex, diff, hc) {
    const base = hex(colourHex), unlit = base.map(v => v * 0.5);
    const glint = findGlint(luma(base) > 150, hc);
    const scale = findFloorScale(luma(unlit), glint);
    const s = findSheen({ ...base0, floor: DIFFICULTY[diff].findFloor, floorScale: scale, hc });
    const out = unlit.map((v, k) => v + (glint[k] - v) * s);
    return Math.abs(luma(out) - luma(unlit));
}
const base0 = { lit: 0, ridge: 1, mask: 1, res: 1, dotted: true };

test('floor luma change on every surface colour: about 30 at medium, easy more, hard none, High contrast more', () => {
    for (const surf of Object.values(SURFACES)) for (const c of surf.colours) {
        const at = (d, hc) => floorDelta(c, d, hc);
        assert.ok(at('medium', false) >= 25 && at('medium', false) <= 40, `${surf.id} ${c} medium ${at('medium', false)}`);
        assert.ok(at('easy', false) > at('medium', false), `${surf.id} easy > medium`);
        assert.equal(at('hard', false), 0, `${surf.id} hard shows no floor without High contrast`);
        for (const d of ['easy', 'medium', 'hard']) {
            assert.ok(at(d, true) > at(d, false), `${surf.id} ${c} ${d}: High contrast must exceed default`);
            assert.ok(at(d, true) >= 20, `${surf.id} ${c} ${d} HC change ${at(d, true)} is visible`);
        }
    }
});

test('floor blend stays a hint: capped below full strength', () => {
    for (const d of ['easy', 'medium', 'hard']) {
        const s = findSheen({ ...base0, floor: DIFFICULTY[d].findFloor, floorScale: 8, hc: true });
        assert.ok(s <= 0.9);
    }
});

test('hard floor is 0 so hard needs the torch with High contrast off', () => {
    assert.equal(DIFFICULTY.hard.findFloor, 0);
    assert.equal(findSheen({ ...base0, floor: 0, hc: false }), 0);
    assert.ok(findSheen({ ...base0, floor: 0, hc: true }) > 0);
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

// ---- close toast: every toast counted through startDustingMinigame -> recordLift

const { MinigameScene } = await import(pathToFileURL(join(root, 'js/minigames/framework/base-minigame.js')).href);
let onComplete, onForcedEnd, toasts;
function compareGame({ identified }) {
    const g = Object.create(DustingMinigame.prototype);
    Object.assign(g, {
        mounted: true, final: { quality: 0.8, rating: 'good' }, _resultSent: false, identified,
        print: { pattern: 'loop' }, surfaceId: 'glass', powder: 'black', objectId: 'o1', ownerName: 'X',
        gameResult: null
    });
    g._buildResult = () => ({ quality: 0.64, rating: 'Fair', pattern: 'loop', identified: g.identified === true, surface: 'glossy_light', objectId: 'o1' });
    // the framework hands gameResult to the opener's onComplete
    MinigameScene.prototype.complete = function (success) { onComplete(success, this.gameResult); };
    return g;
}
function setup() {
    toasts = [];
    globalThis.window.showNotification = (...a) => toasts.push(['showNotification', ...a]);
    globalThis.window.gameAlert = (...a) => toasts.push(['gameAlert', ...a]);
    globalThis.window.gameState = { biometricSamples: [], globalVariables: {} };
    globalThis.window.eventDispatcher = { emit() {} };
    globalThis.window.game = {};
    globalThis.window.MinigameFramework = {
        mainGameScene: {},
        startMinigame(_n, _c, opts) { onComplete = opts.onComplete; onForcedEnd = opts.onForcedEnd; }
    };
    startDustingMinigame({ scenarioData: { id: 'o1', name: 'Mug', fingerprintOwner: 'Robert Vance' } });
}

test('close after the peel gives exactly one toast, titled Print Logged, and still records', () => {
    setup();
    const g = compareGame({ identified: false });
    g.complete(false);
    assert.equal(toasts.length, 1, JSON.stringify(toasts));
    assert.equal(toasts[0][0], 'gameAlert');
    assert.match(toasts[0][1], /Lifted a print from Mug \(Fair, 64%\)/);
    assert.equal(toasts[0][3], 'Print Logged');
    assert.equal(window.gameState.biometricSamples.length, 1);
    g.complete(false); // a second close call must not toast again
    assert.equal(toasts.length, 1);
});

test('Log the print then close gives one toast, titled Print Lifted as today', () => {
    setup();
    const g = compareGame({ identified: true });
    g._finish();
    g.complete(false);
    assert.equal(toasts.length, 1, JSON.stringify(toasts));
    assert.equal(toasts[0][3], 'Print Lifted');
});

test('closing before the peel is a plain cancel with no toast', () => {
    setup();
    const g = compareGame({ identified: true });
    g.mounted = false;
    g.final = null;
    g.complete(false);
    assert.equal(toasts.length, 0);
    assert.equal(window.gameState.biometricSamples.length, 0);
});

// ---- brushing coach

test('foggy warning agrees with the Lift threshold', () => {
    const min = DIFFICULTY.medium.minCoverage;
    const below = foggyCoach(0.34, min), above = foggyCoach(min, min);
    assert.doesNotMatch(below, /lift now/i, 'below the threshold the player cannot lift now');
    assert.match(below, /Puff/);
    assert.match(below, /Lift unlocks at 45%/);
    assert.match(above, /or lift now/);
    for (const d of Object.values(DIFFICULTY)) {
        assert.doesNotMatch(foggyCoach(d.minCoverage - 0.01, d.minCoverage), /lift now/i);
        assert.match(foggyCoach(d.minCoverage, d.minCoverage), /lift now/i);
    }
});

test('the coach shows the below-threshold line at 34% coverage with heavy powder', () => {
    const g = Object.create(DustingMinigame.prototype);
    Object.assign(g, { metrics: { coverage: 0.34, clarity: 0.4, foggy: 0.2 }, powder: 'black', surfaceId: 'glossy_light', diff: DIFFICULTY.medium });
    assert.match(g._coach(), /Lift unlocks at 45%/);
    g.metrics.coverage = 0.5;
    assert.match(g._coach(), /or lift now/);
});

// ---- forced end (scripted call or conversation: endMinigame(false, null) skips complete)

test('a forced end on the compare screen after the peel records the lift with one Print Logged toast', () => {
    setup();
    const g = compareGame({ identified: false });
    Object.assign(g, { params: { onForcedEnd }, _timers: [] });
    globalThis.cancelAnimationFrame = () => {};
    MinigameScene.prototype.cleanup = function () {};
    assert.equal(typeof onForcedEnd, 'function');
    g.cleanup();
    assert.equal(toasts.length, 1, JSON.stringify(toasts));
    assert.equal(toasts[0][3], 'Print Logged');
    assert.deepEqual(toasts[0][5], { html: false });
    assert.equal(window.gameState.biometricSamples.length, 1);
    g.cleanup(); // cleanup twice must not record twice
    assert.equal(toasts.length, 1);
});

test('cleanup after Log the print, or before the peel, records nothing extra', () => {
    setup();
    const g = compareGame({ identified: false });
    Object.assign(g, { params: { onForcedEnd }, _timers: [] });
    g._finish = DustingMinigame.prototype._finish;
    g._finish();
    const n = toasts.length;
    g.cleanup();
    assert.equal(toasts.length, n);
    setup();
    const h = compareGame({ identified: false });
    Object.assign(h, { params: { onForcedEnd }, _timers: [], mounted: false, final: null });
    h.cleanup();
    assert.equal(toasts.length, 0);
});

test('the find floor scale never drops below 1: no surface goes under the tuned blend', () => {
    for (const surf of Object.values(SURFACES)) for (const c of surf.colours) {
        const base = hex(c), unlit = base.map(v => v * 0.5);
        for (const hc of [false, true]) {
            assert.ok(findFloorScale(luma(unlit), findGlint(luma(base) > 150, hc)) >= 1, `${surf.id} ${c}`);
        }
    }
    assert.equal(findFloorScale(100, [100, 100, 100]), 1);
});

test('the coverage text rounds down so 45% is never shown while Lift is locked', () => {
    const g = Object.create(DustingMinigame.prototype);
    const texts = {};
    Object.assign(g, { step: 'dust', metrics: { coverage: 0.4496, clarity: 0.1, foggy: 0 }, diff: DIFFICULTY.medium, powder: 'black', surfaceId: 'glossy_light', tape: { coverage: () => 0 },
        root: { classList: { contains: () => false } }, panel: { querySelectorAll: () => [] } });
    g._setDyn = (k, fn) => { const el = { style: {}, textContent: '', dataset: {}, querySelector: () => ({}) }; fn(el); texts[k] = el.textContent; };
    g._currentQuality = () => 0.5;
    g._refreshDynamic();
    assert.match(texts['cov-text'], /^44%/);
});
