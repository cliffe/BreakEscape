// Lockpicking on a big desktop window (1600 wide and up): the lock only grows by whole zooms, and
// with the full item strip above it a 2x lock does not fit at 1920x1080. LOCK_WIDE_OPTION picks
// the layout: A no change, B compact strip when that unlocks a whole zoom of 2 or more (the
// default), C full strip in a column beside the lock. The room is measured with each layout and
// the bigger zoom wins. Phones and short windows never reach any of it.
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

// A lock in a 1920x1080 window. rooms: the room left for the canvas with the full strip, with the
// compact strip, and with the strip in a side column (what the real _lockRoom would measure)
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
        _lockRoom: () => {
            if (shell.classList.contains('lockpicking-side')) return rooms.side;
            return sec.classList.contains('lockpicking-compact') ? rooms.compact : rooms.full;
        }
    };
    return { fake, sec, shell, zoom: () => fake.game.scale.zoom };
}
// 1920x1080: full strip leaves 670 high (zoom 1), compact 850 (zoom 2), a side column 920 (zoom 2)
const ROOMY = { full: { w: 1900, h: 670 }, compact: { w: 1900, h: 850 }, side: { w: 1560, h: 920 } };
// 1600x900: full 490, compact 670, side 740 (a long feedback box): nothing reaches 2
const TIGHT = { full: { w: 1580, h: 490 }, compact: { w: 1580, h: 670 }, side: { w: 1240, h: 740 } };

test('the wide option is B by default and only A, B and C are accepted', () => {
    assert.ok(L.wideOption() === 'B', 'default ' + L.wideOption());
    assert.ok(L.setWideOption('Z') === false && L.wideOption() === 'B', 'an unknown option is refused');
    assert.ok(L.setWideOption('A') === true && L.wideOption() === 'A');
    L.setWideOption('B');
});

test('option A leaves a roomy window at the zoom the full strip gives', () => {
    L.setWideOption('A');
    try {
        const t = rig(ROOMY);
        at(1920, 1080, () => H._fitLockZoom.call(t.fake));
        assert.ok(!t.sec.classList.contains('lockpicking-compact') && !t.shell.classList.contains('lockpicking-side'), 'no layout change');
        assert.ok(t.zoom() === 1, 'zoom ' + t.zoom());
    } finally { L.setWideOption('B'); }
});

test('option B goes compact when that unlocks zoom 2, and not when it leaves the zoom at 1', () => {
    L.setWideOption('B');
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

test('option B does not compact for a fraction: a 1x to 1x room with a taller compact room keeps the full strip', () => {
    L.setWideOption('B');
    const t = rig({ full: { w: 1900, h: 450 }, compact: { w: 1900, h: 790 }, side: { w: 1500, h: 790 } });
    at(1920, 1080, () => H._fitLockZoom.call(t.fake));
    assert.ok(!t.sec.classList.contains('lockpicking-compact'), 'compact room 790 is still zoom 1');
    assert.ok(t.zoom() === 1, 'zoom ' + t.zoom());
});

test('option B is sticky across a feedback pass and relaxes on a resize pass', () => {
    L.setWideOption('B');
    const t = rig(ROOMY);
    at(1920, 1080, () => H._fitLockZoom.call(t.fake, false));
    assert.ok(t.sec.classList.contains('lockpicking-compact'), 'a feedback pass can add compact');
    // the full strip would now fit at 2 as well, or not: the strip stays put on a feedback pass
    at(1920, 1080, () => H._fitLockZoom.call(t.fake, false));
    assert.ok(t.sec.classList.contains('lockpicking-compact') && t.zoom() === 2, 'sticky');
    // a window resize that leaves the room tight drops it again
    const tight = rig(TIGHT);
    tight.sec.classList.add('lockpicking-compact');
    tight.fake._lockCompact = true;
    at(1600, 900, () => H._fitLockZoom.call(tight.fake, true));
    assert.ok(!tight.sec.classList.contains('lockpicking-compact'), 'relax true drops compact');
});

test('option C moves the strip beside the lock when that unlocks zoom 2, and drops it when it does not', () => {
    L.setWideOption('C');
    try {
        const t = rig(ROOMY);
        at(1920, 1080, () => H._fitLockZoom.call(t.fake));
        assert.ok(t.shell.classList.contains('lockpicking-side') && t.fake._lockSide === true, 'side on');
        assert.ok(!t.sec.classList.contains('lockpicking-compact'), 'the strip stays full size beside the lock');
        assert.ok(t.zoom() === 2, 'zoom ' + t.zoom());
        const u = rig(TIGHT);
        at(1600, 900, () => H._fitLockZoom.call(u.fake));
        assert.ok(!u.shell.classList.contains('lockpicking-side') && u.fake._lockSide === false, 'side dropped');
        assert.ok(u.zoom() === 1, 'zoom ' + u.zoom());
    } finally { L.setWideOption('B'); }
});

test('option C is sticky across a feedback pass, relaxes on a resize pass, and never runs with option B at once', () => {
    L.setWideOption('C');
    try {
        const t = rig(ROOMY);
        at(1920, 1080, () => H._fitLockZoom.call(t.fake, false));
        assert.ok(t.shell.classList.contains('lockpicking-side'));
        // the feedback grows: nothing reaches 2 now, yet the layout stays on a feedback pass
        t.fake._lockRoom = () => TIGHT.side;
        at(1920, 1080, () => H._fitLockZoom.call(t.fake, false));
        assert.ok(t.shell.classList.contains('lockpicking-side') && t.zoom() === 1, 'side kept, lock at ' + t.zoom());
        assert.ok(!t.sec.classList.contains('lockpicking-compact'), 'not both layouts');
        t.fake._lockRoom = () => (t.shell.classList.contains('lockpicking-side') ? TIGHT.side : t.sec.classList.contains('lockpicking-compact') ? TIGHT.compact : TIGHT.full);
        at(1600, 900, () => H._fitLockZoom.call(t.fake, true));
        assert.ok(!t.shell.classList.contains('lockpicking-side') && t.fake._lockSide === false, 'relax true drops it');
    } finally { L.setWideOption('B'); }
});

test('phones and short windows never reach the wide layouts, and the fitted layout clears them', () => {
    for (const opt of ['B', 'C']) {
        L.setWideOption(opt);
        try {
            for (const [w, h] of [[844, 390], [390, 844], [768, 1000], [1280, 560]]) {
                const t = rig(ROOMY);
                at(w, h, () => H._fitLockZoom.call(t.fake));
                assert.ok(!t.sec.classList.contains('lockpicking-compact') && !t.shell.classList.contains('lockpicking-side'), `${opt} ${w}x${h}: untouched`);
                assert.ok(t.zoom() === 1, 'no zoom call');
            }
        } finally { L.setWideOption('B'); }
    }
    const t = rig(ROOMY);
    t.shell.classList.add('lockpicking-side');
    t.sec.classList.add('lockpicking-compact');
    t.fake._lockSide = true; t.fake._lockCompact = true;
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
    assert.ok(!t.shell.classList.contains('lockpicking-side') && !t.sec.classList.contains('lockpicking-compact'), 'fitted layout clears both');
    assert.ok(t.fake._lockSide === false && t.fake._lockCompact === false, 'flags cleared');
});

test('the side layout CSS is scoped to .lockpicking-side inside the desktop media query, ahead of the short-window block', () => {
    const css = readFileSync(join(root, 'css/lockpicking.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const blocks = [];
    const re = /@media([^{]+)\{/g;
    let m;
    while ((m = re.exec(css))) {
        let depth = 1, i = re.lastIndex;
        while (depth && i < css.length) { if (css[i] === '{') depth++; else if (css[i] === '}') depth--; i++; }
        blocks.push({ query: m[1].trim(), body: css.slice(re.lastIndex, i - 1), at: m.index });
    }
    const side = blocks.filter((b) => b.body.includes('lockpicking-side'));
    assert.ok(side.length === 1, 'one block holds the side layout: ' + side.length);
    assert.ok(/^\(min-width:\s*769px\)\s*and\s*\(min-height:\s*561px\)$/.test(side[0].query), 'desktop only: ' + side[0].query);
    for (const sel of side[0].body.split('}').map((r) => r.split('{')[0].trim()).filter(Boolean)) {
        assert.ok(sel.split(',').every((s) => s.trim().includes('.lockpicking-side')), 'unscoped selector: ' + sel);
    }
    assert.ok(!/border-radius\s*:\s*[1-9]/.test(side[0].body) && !/box-shadow\s*:\s*[^n]/.test(side[0].body), 'pixel-art rules: no radius or shadow');
    const last = blocks.filter((b) => /max-height:\s*560px\)$/.test(b.query) && !b.query.includes('min-width'));
    assert.ok(side[0].at < last[last.length - 1].at, 'the short-window block stays last');
});
