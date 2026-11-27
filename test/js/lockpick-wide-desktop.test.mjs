// Lockpicking on a big desktop window (1600 wide and up): the lock only grows by whole zooms, and
// with the full item strip above it a 2x lock does not fit at 1920x1080. The compact strip is used
// when that unlocks a whole zoom of 2 or more. The room is measured with each strip and the bigger
// zoom wins. Phones and short windows never reach any of it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const anything = () => new Proxy(function () {}, {
    get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : anything()),
    apply: () => anything(),
    construct: () => anything()
});
globalThis.AudioContext = window.AudioContext = function () { return anything(); };
globalThis.Audio = window.Audio = globalThis.AudioContext;

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape');
const { LockpickingMinigamePhaser: L } = await import(pathToFileURL(join(root, 'js/minigames/lockpicking/lockpicking-game-phaser.js')).href);
const H = L.prototype;
globalThis.Phaser = { Scale: { FIT: 3, NONE: 0, CENTER_BOTH: 1, NO_CENTER: 0 } };

const at = (w, h, fn) => {
    const sw = window.innerWidth, sh = window.innerHeight;
    window.innerWidth = w; window.innerHeight = h;
    try { return fn(); } finally { window.innerWidth = sw; window.innerHeight = sh; }
};

// A lock in a 1920x1080 window. rooms: the room left for the canvas with the full strip and with
// the compact strip (what the real _lockRoom would measure)
function rig(rooms) {
    document.body.innerHTML = '<div id="shell" class="minigame-container"><div id="sec" class="lockpicking-item-section"></div><div class="game"><div id="phaser-game-container"></div></div></div>';
    const sec = document.getElementById('sec');
    const shell = document.getElementById('shell');
    const fake = {
        container: shell,
        gameContainer: document.querySelector('.game'),
        game: { scale: { zoom: 1, setZoom: (z) => { fake.game.scale.zoom = z; } } },
        _lockFitApplied: { fit: false, portrait: false, capped: false },
        _itemSection: sec, _syncObsButton: () => {},
        _lockRoom: () => (sec.classList.contains('lockpicking-compact') ? rooms.compact : rooms.full)
    };
    return { fake, sec, shell, zoom: () => fake.game.scale.zoom };
}
// 1920x1080: full strip leaves 670 high (zoom 1), compact 850 (zoom 2)
const ROOMY = { full: { w: 1900, h: 670 }, compact: { w: 1900, h: 850 } };
// 1600x900: full 490, compact 670: nothing reaches 2
const TIGHT = { full: { w: 1580, h: 490 }, compact: { w: 1580, h: 670 } };

test('a roomy window goes compact when that unlocks zoom 2, and not when it leaves the zoom at 1', () => {
    const t = rig(ROOMY);
    at(1920, 1080, () => H._fitLockZoom.call(t.fake));
    assert.ok(t.sec.classList.contains('lockpicking-compact') && t.fake._lockCompact === true, 'compact on');
    assert.ok(t.zoom() === 2, 'zoom ' + t.zoom());
    assert.ok(document.querySelector('#phaser-game-container').style.maxWidth === '1200px', 'box width for zoom 2');
    const u = rig(TIGHT);
    at(1600, 900, () => H._fitLockZoom.call(u.fake));
    assert.ok(!u.sec.classList.contains('lockpicking-compact') && u.fake._lockCompact === false, 'compact dropped: no whole zoom gained');
    assert.ok(u.zoom() === 1, 'zoom ' + u.zoom());
});

test('a roomy window does not compact for a fraction: a 1x to 1x room with a taller compact room keeps the full strip', () => {
    const t = rig({ full: { w: 1900, h: 450 }, compact: { w: 1900, h: 790 } });
    at(1920, 1080, () => H._fitLockZoom.call(t.fake));
    assert.ok(!t.sec.classList.contains('lockpicking-compact'), 'compact room 790 is still zoom 1');
    assert.ok(t.zoom() === 1, 'zoom ' + t.zoom());
});

test('a roomy window is sticky across a feedback pass and relaxes on a resize pass', () => {
    const rooms = { ...ROOMY };
    const t = rig(rooms);
    at(1920, 1080, () => H._fitLockZoom.call(t.fake, false));
    assert.ok(t.sec.classList.contains('lockpicking-compact'), 'a feedback pass can add compact');
    // the feedback grows: full and compact both give zoom 1 now, so a fresh measure would drop it
    Object.assign(rooms, { full: { w: 1900, h: 450 }, compact: { w: 1900, h: 600 } });
    at(1920, 1080, () => H._fitLockZoom.call(t.fake, false));
    assert.ok(t.sec.classList.contains('lockpicking-compact') && t.fake._lockCompact === true, 'sticky: compact stays on a feedback pass');
    assert.ok(t.zoom() === 1, 'zoom follows the compact room: ' + t.zoom());
    // the same object on a resize pass measures afresh and drops it
    at(1920, 1080, () => H._fitLockZoom.call(t.fake, true));
    assert.ok(!t.sec.classList.contains('lockpicking-compact') && t.fake._lockCompact === false, 'relax true drops compact');
    // a resize that leaves the room tight drops it again (fresh rig)
    const tight = rig(TIGHT);
    tight.sec.classList.add('lockpicking-compact');
    tight.fake._lockCompact = true;
    at(1600, 900, () => H._fitLockZoom.call(tight.fake, true));
    assert.ok(!tight.sec.classList.contains('lockpicking-compact'), 'relax true drops compact');
});

test('a roomy window only tries the compact strip when the full strip already gives a whole zoom (the wide guard)', () => {
    // A 1366x768-like room: full gives 0.8 (not under LOCK_COMPACT_BELOW), so only the wide rule
    // could try compact. The real compact room cannot reach 2 from here, but a rig can: the
    // layout must still stay off, because the guard skips the try (two class flips and reflows saved).
    const t = rig({ full: { w: 1340, h: 320 }, compact: { w: 1340, h: 850 } });
    at(1366, 768, () => H._fitLockZoom.call(t.fake));
    assert.ok(!t.sec.classList.contains('lockpicking-compact') && t.fake._lockCompact === false, 'no compact class below zoom 1');
    assert.ok(t.zoom() === 0.8, 'zoom ' + t.zoom());
    // the same rooms at zoom 1 full do try it
    const u = rig({ full: { w: 1340, h: 420 }, compact: { w: 1340, h: 850 } });
    at(1366, 768, () => H._fitLockZoom.call(u.fake));
    assert.ok(u.sec.classList.contains('lockpicking-compact') && u.zoom() === 2, 'full zoom 1 tries compact');
});

test('the zoomed class goes on the lock box for a whole zoom above 1 only', () => {
    const box = () => document.querySelector('#phaser-game-container');
    const t = rig(ROOMY);
    at(1920, 1080, () => H._fitLockZoom.call(t.fake));
    assert.ok(box().classList.contains('lockpicking-zoomed'), 'zoom 2: class on the box');
    const u = rig(TIGHT);
    at(1600, 900, () => H._fitLockZoom.call(u.fake));
    assert.ok(!box().classList.contains('lockpicking-zoomed'), 'zoom 1: no class');
    const v = rig({ full: { w: 1340, h: 320 }, compact: { w: 1340, h: 330 } });
    at(1366, 768, () => H._fitLockZoom.call(v.fake));
    assert.ok(v.zoom() < 1 && !box().classList.contains('lockpicking-zoomed'), 'fraction under 1: no class');
});

test('one lock keeps .lockpicking-zoomed at 2x and loses it when a resize refit brings it down to 1x', () => {
    const box = () => document.querySelector('#phaser-game-container');
    const rooms = { ...ROOMY };
    const t = rig(rooms);
    at(1920, 1080, () => H._fitLockZoom.call(t.fake));
    assert.ok(t.zoom() === 2, 'starts at zoom ' + t.zoom());
    assert.ok(box().classList.contains('lockpicking-zoomed') === true, '2x: class on the box');
    // the same instance and box: the window shrinks to 1600x900, the refit measures the tight rooms
    Object.assign(rooms, TIGHT);
    at(1600, 900, () => H._fitLockZoom.call(t.fake, true));
    assert.ok(t.zoom() === 1, 'refit lands at zoom ' + t.zoom());
    assert.ok(box().classList.contains('lockpicking-zoomed') === false, '1x after 2x: class removed from the same box');
    assert.ok(box().style.maxWidth === '600px', 'box width follows: ' + box().style.maxWidth);
});

test('the zoomed canvas is scaled nearest-neighbour, only under .lockpicking-zoomed (R1 M1)', () => {
    const css = readFileSync(join(root, 'css/lockpicking.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const rules = [];
    const re = /([^{}@]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(css))) rules.push({ sel: m[1].trim(), body: m[2] });
    const crisp = rules.filter((r) => /image-rendering\s*:\s*pixelated/.test(r.body) && /canvas/.test(r.sel));
    assert.ok(crisp.length >= 1 && crisp.every((r) => r.sel.split(',').every((s) => /#phaser-game-container\.lockpicking-zoomed\s+canvas\s*$/.test(s.trim()))), 'a pixelated canvas rule scoped to .lockpicking-zoomed: ' + JSON.stringify(crisp.map((r) => r.sel)));
    const unscoped = rules.filter((r) => /image-rendering/.test(r.body) && /canvas/.test(r.sel) && !/lockpicking-zoomed/.test(r.sel));
    assert.ok(unscoped.length === 0, 'no unscoped canvas image-rendering: ' + JSON.stringify(unscoped.map((r) => r.sel)));
});

test('phones and short windows never reach the wide layout, and the fitted layout clears it', () => {
    for (const [w, h] of [[844, 390], [390, 844], [768, 1000], [1280, 560]]) {
        const t = rig(ROOMY);
        at(w, h, () => H._fitLockZoom.call(t.fake));
        assert.ok(!t.sec.classList.contains('lockpicking-compact'), `${w}x${h}: untouched`);
        assert.ok(t.zoom() === 1, 'no zoom call');
    }
    const t = rig(ROOMY);
    t.sec.classList.add('lockpicking-compact');
    t.fake._lockCompact = true;
    const scale = {
        scaleMode: 0, autoCenter: 0, zoom: 2, canvas: { style: {} },
        displaySize: { setMax() {}, setAspectMode() {}, setParent() {} },
        parentSize: { width: 400, height: 300 }, setGameSize() {}, getParentBounds: () => true, refresh() {}
    };
    t.fake.game = { scale };
    t.fake._watchLockBox = () => {};
    t.fake._placeKeyPanel = () => {};
    t.fake.scene = { cameras: { main: { setScroll() {} } } };
    H._applyLockFit.call(t.fake, t.fake.game, document.querySelector('#phaser-game-container'), { fit: true, portrait: false, capped: true });
    assert.ok(!t.sec.classList.contains('lockpicking-compact'), 'fitted layout clears compact');
    assert.ok(t.fake._lockCompact === false, 'flag cleared');
});
