// build/ui-minigames2: the shared scanner panel (A22), the tool-window cap (A45) and the
// title screen's stepped vignette (A38). Reads the stylesheets and scene sources.
// Run with: node test/js/minigames2-ui.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { inflateSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const pub = join(root, 'public/break_escape');
const css = (f) => readFileSync(join(pub, 'css', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const src = (f) => readFileSync(join(pub, 'js', f), 'utf8');

// Declarations of the first top-level block whose selector list is exactly `sel`
function block(text, sel) {
    const re = new RegExp('(^|\\})\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}');
    const m = text.match(re);
    if (!m) return null;
    const out = {};
    for (const d of m[2].split(';')) {
        const i = d.indexOf(':');
        if (i > 0) out[d.slice(0, i).trim()] = d.slice(i + 1).trim();
    }
    return out;
}

const SCANNERS = [
    ['ble', 'ble-scanner/ble-scanner-minigame.js', 'ble-scanner.css'],
    ['bluetooth', 'bluetooth/bluetooth-scanner-minigame.js', 'bluetooth-scanner.css'],
    ['biometrics', 'biometrics/biometrics-minigame.js', 'biometrics-minigame.css']
];

test('A22: each scanner joins the shared panel with its own accent class', () => {
    for (const [key, js] of SCANNERS) {
        const s = src(`minigames/${js}`);
        assert.match(s, new RegExp(`classList\\.add\\('scanner-panel', 'scanner-panel--${key}'\\)`), key);
        for (const part of ['scan-header', 'scan-title', 'scan-status', 'scan-search', 'scan-chips', 'scan-list-wrap', 'scan-list-header', 'scan-count', 'scan-list']) {
            assert.match(s, new RegExp(`\\b${part}\\b`), `${key}: ${part}`);
        }
    }
});

test('A22: one accent per scanner, all different, and the shared parts use the accent', () => {
    const c = css('scanner-panel.css');
    const accents = SCANNERS.map(([key]) => block(c, `.scanner-panel--${key}`)?.['--scan-accent']);
    assert.ok(accents.every(Boolean), 'every scanner sets --scan-accent');
    assert.equal(new Set(accents).size, 3, 'three different accents');
    assert.equal(block(c, '.scanner-panel .scan-header').border, '2px solid var(--scan-accent)');
    assert.equal(block(c, '.scanner-panel :is(#ble-search, #bluetooth-search, #biometrics-search, .scan-search).scan-search').border, '2px solid var(--scan-accent)');
    assert.equal(block(c, '.scanner-panel .scan-chips')['flex-wrap'], 'wrap');
    const frame = block(c, '.minigame-container.scanner-panel');
    assert.equal(frame.left, '2vw !important', 'the panel stays on the left, 2vw in');
    assert.equal(frame.border, '4px solid var(--scan-accent) !important');
});

test('A22: the scenes\' own sheets no longer style the shared parts', () => {
    const owned = {
        'ble-scanner.css': ['.ble-scanner-header', '.ble-search-input', '.ble-category', '.ble-device-list-header'],
        'bluetooth-scanner.css': ['.bluetooth-scanner-header', '.bluetooth-search-input', '.bluetooth-category', '.bluetooth-scanner-expand-toggle'],
        'biometrics-minigame.css': ['.biometrics-scanner-header', '.biometrics-search-input', '.biometrics-category', '.biometrics-expand-toggle']
    };
    for (const [f, sels] of Object.entries(owned)) {
        const c = css(f);
        for (const sel of sels) assert.equal(block(c, sel), null, `${f}: ${sel}`);
    }
    const view = readFileSync(join(root, 'app/views/break_escape/games/show.html.erb'), 'utf8');
    assert.ok(view.indexOf('css/scanner-panel.css') > view.indexOf('css/biometrics-minigame.css'), 'shared sheet loads after the scene sheets');
});

test('A45: tool windows are capped at 960x720, wrap their content and centre', () => {
    const c = css('minigames-framework.css');
    const sel = '.minigame-container[data-minigame="flag-station"] > .minigame-game-container,\n.minigame-container[data-minigame="vm-launcher"] > .minigame-game-container,\n.minigame-container[data-minigame="container"] > .minigame-game-container:not(:has(.desktop-mode)),\n.minigame-container[data-minigame="combination"] > .minigame-game-container,\n.minigame-container[data-minigame="cryptex"] > .minigame-game-container,\n.minigame-container[data-minigame="text-file"] > .minigame-game-container';
    const r = block(c, sel);
    assert.ok(r, 'the cap rule covers the six tool windows, not the PC desktop');
    assert.equal(r['max-width'], 'min(960px, 100%)');
    assert.equal(r['max-height'], 'min(720px, 100%)');
    assert.equal(r.width, 'fit-content');
    assert.equal(r.height, 'auto');
    assert.equal(r.margin, 'auto');
    // Regression (shell-x-check, 2026-11-14): with height auto and no floor, a window whose
    // content is not drawn yet (or is empty) collapsed to its padding and the X fell outside it
    assert.match(r['min-height'] || '', /^min\(\d+px, 100%\)$/, 'a min-height floor keeps an empty window from collapsing');
    assert.ok(parseInt(r['min-height'].slice(4), 10) >= 100, 'the floor holds the X and a line of content');
});

// The PNG's colour type and its distinct alpha values (8-bit RGBA, filter bytes skipped)
function pngAlphas(buf) {
    let off = 8, w = 0, h = 0, type = 0;
    const idat = [];
    while (off < buf.length) {
        const len = buf.readUInt32BE(off), kind = buf.toString('ascii', off + 4, off + 8);
        const data = buf.subarray(off + 8, off + 8 + len);
        if (kind === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); type = data[9]; }
        if (kind === 'IDAT') idat.push(data);
        off += 12 + len;
    }
    const raw = inflateSync(Buffer.concat(idat));
    const stride = w * 4 + 1;
    // Undo the PNG row filters (Sub, Up, Average, Paeth) to read the real alpha values
    const out = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) {
        const f = raw[y * stride];
        for (let x = 0; x < w * 4; x++) {
            const v = raw[y * stride + 1 + x];
            const a = x >= 4 ? out[y * w * 4 + x - 4] : 0;
            const b = y > 0 ? out[(y - 1) * w * 4 + x] : 0;
            const c = x >= 4 && y > 0 ? out[(y - 1) * w * 4 + x - 4] : 0;
            let p = 0;
            if (f === 1) p = a; else if (f === 2) p = b; else if (f === 3) p = (a + b) >> 1;
            else if (f === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
            out[y * w * 4 + x] = (v + p) & 0xff;
        }
    }
    const alphas = new Set();
    for (let i = 3; i < out.length; i += 4) alphas.add(out[i]);
    return { type, alphas };
}

test('A38: the title vignette is a stepped image of a few flat shades; no radial gradient or glow', () => {
    const c = css('title-screen.css');
    const after = block(c, '.title-screen-container::after');
    assert.match(after.background, /title-vignette\.png/);
    assert.equal(after['image-rendering'], 'pixelated');
    assert.doesNotMatch(c, /radial-gradient/);
    assert.doesNotMatch(c, /drop-shadow/);
    const { type, alphas } = pngAlphas(readFileSync(join(pub, 'assets/ui/title-vignette.png')));
    assert.equal(type, 6, 'RGBA');
    assert.ok(alphas.size >= 3 && alphas.size <= 6, `a few flat shades, got ${alphas.size}`);
    assert.ok(alphas.has(0), 'clear in the middle');
});
