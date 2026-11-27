// Short PC sign-in (a landscape phone): a tile keeps its username line, one ellipsised GNF 16px line,
// when it has 16px of height to spare (data-username-fits), and hides it when it does not. The CSS
// rule is pinned, and fitSignInUsernames is run with fake rects: it measures from a clean baseline,
// flags only tiles with the spare line, clears the flags when the frame is not short, and does not
// loop (it re-measures once on the next frame and nothing else).
// Run with: node --max-old-space-size=2048 test/js/signin-short-username.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const css = readFileSync(join(here, '../../public/break_escape/css/password-minigame.css'), 'utf8');
const dir = mkdtempSync(join(tmpdir(), 'signin-short-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('config.js', 'export const ASSETS_PATH = "/break_escape/assets";\n');
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
for (const f of ['utils/escape-html.js', 'utils/lock-scope-refusal.js', 'utils/dispense-on-unlock.js',
    'minigames/container/container-item-image.js', 'utils/computer-keywords.js', 'utils/pc-monitor.js',
    'utils/npc-headshot.js', 'utils/author-html.js', 'minigames/framework/base-minigame.js',
    'utils/remote-host-text.js', 'minigames/password/password-minigame.js']) copy(f);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { PasswordMinigame } = await import(pathToFileURL(join(dir, 'minigames/password/password-minigame.js')));


const rule = (selector) => {
    const i = css.indexOf(selector + ' {');
    assert.ok(i >= 0, `rule ${selector} exists`);
    return css.slice(i, css.indexOf('}', i));
};

test('CSS: short hides the line by default and a tile with data-username-fits keeps it on one ellipsised line', () => {
    assert.ok(/display:\s*none/.test(rule('.pc-monitor[data-short] .signin-username')), 'short still hides the line by default');
    const r = rule('.pc-monitor[data-short] .signin-tile[data-username-fits] .signin-username');
    assert.ok(/display:\s*block/.test(r), 'shown');
    assert.ok(/white-space:\s*nowrap/.test(r), 'one line');
    assert.ok(/overflow:\s*hidden/.test(r), 'clipped');
    assert.ok(/text-overflow:\s*ellipsis/.test(r), 'ellipsis');
    assert.ok(/max-width:\s*100%/.test(r), 'no wider than the tile');
    assert.ok(/font-size:\s*16px/.test(rule('.signin-username')) && /line-height:\s*16px/.test(rule('.signin-username')), 'GNF 16px on a 16px line');
});

test('CSS: the fits rule comes after the short hide rule and does not use a height or radius', () => {
    const hide = css.indexOf('.pc-monitor[data-short] .signin-username {');
    const keep = css.indexOf('.pc-monitor[data-short] .signin-tile[data-username-fits] .signin-username {');
    assert.ok(hide >= 0 && keep > hide, 'order');
    const r = rule('.pc-monitor[data-short] .signin-tile[data-username-fits] .signin-username');
    assert.ok(!/radius|height/.test(r), 'no radius, no height of its own');
});

// ── fitSignInUsernames with fake rects ──────────────────────────────────────
function make(short, scale = 1) {
    document.body.innerHTML = '<div id="mg"></div>';
    const frames = [];
    window.requestAnimationFrame = (cb) => { frames.push(cb); return frames.length; };
    window.visualViewport = null;
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    window.gameAlert = () => {};
    window.playUISound = () => {};
    window.pcSessions = { signIn: async () => ({ ok: false }) };
    const mg = new PasswordMinigame(document.getElementById('mg'), {
        title: 'Hot desk PC', lockable: { scenarioData: { id: 'hot_desk' } }, type: 'item',
        signIn: { pcId: 'hot_desk', pcName: 'Hot desk PC', picker: 'accounts', tiles: TILES, current: null },
        showPostit: false
    });
    window.MinigameFramework.currentMinigame = mg;
    mg.init();
    mg.start();
    const root = document.createElement('div');
    if (short) root.setAttribute('data-short', '');
    root.dataset.uiScale = String(scale);
    mg.pcMonitor = { root, destroy() {} };
    const flush = () => { while (frames.length) frames.shift()(); };
    return { mg, frames, flush };
}
const TILES = [
    { username: 'sokafor', displayName: 'Sam Okafor', portrait: null, avatar: null },
    { username: 'admin', displayName: 'Admin', portrait: null, avatar: null }
];
// jsdom gives a button 3px of padding and no CSS file is loaded, so the computed style is faked:
// no border or padding, and `position` from a data-pos attribute (absolute for a badge)
window.getComputedStyle = (el) => ({ borderBottomWidth: '0px', paddingBottom: '0px', position: el?.dataset?.pos || 'static' });
// Fake layout: the name's bottom is 100, the tile's bottom is 100 + spare, minus 16 while the tile
// carries data-username-fits (the line then takes the spare, as in a browser). `tag` adds a tag row
// below the name (bottom 100 + tag), `badge` an absolute corner badge near the bottom.
function layout(mg, spares, { tag = [], reads = null } = {}) {
    const tiles = Array.from(mg.gameContainer.querySelectorAll('.signin-tile'));
    tiles.forEach((t, i) => {
        const nameBottom = 100;
        t.getBoundingClientRect = () => {
            if (reads) reads.n++;
            const b = 100 + (tag[i] || 0) + spares[i] - ('usernameFits' in t.dataset ? 16 : 0);
            return { top: 0, left: 0, right: 84, width: 84, height: b, bottom: b };
        };
        t.querySelector('.signin-name').getBoundingClientRect = () => ({ top: 70, left: 0, right: 84, width: 84, height: 30, bottom: nameBottom });
        if (tag[i]) {
            const el = document.createElement('span');
            el.className = 'signin-tags';
            el.getBoundingClientRect = () => ({ top: 100, left: 0, right: 84, width: 84, height: tag[i], bottom: 100 + tag[i] });
            t.appendChild(el);
        }
    });
    return tiles;
}

test('short: only the tiles with 16px or more spare get data-username-fits', () => {
    const { mg } = make(true);
    const tiles = layout(mg, [0, 17, 15]);
    mg.fitSignInUsernames();
    const got = tiles.map((t) => ('usernameFits' in t.dataset ? 'y' : 'n')).join('');
    assert.ok(got === 'nyn', `flags ${got}`);
    mg.cleanup();
});

test('short: exactly 16px spare fits, border and padding below the name are taken off the spare', () => {
    const { mg } = make(true);
    const tiles = layout(mg, [16, 16]);
    const orig = window.getComputedStyle;
    window.getComputedStyle = (el) => (el === tiles[1] ? { borderBottomWidth: '2px', paddingBottom: '4px' } : orig(el));
    mg.fitSignInUsernames();
    window.getComputedStyle = orig;
    assert.ok('usernameFits' in tiles[0].dataset, '16px, no padding: fits');
    assert.ok(!('usernameFits' in tiles[1].dataset), '16px less 6px of border and padding: does not fit');
    mg.cleanup();
});

test('short stays at x1: a stale data-ui-scale does not change the 16px', () => {
    const { mg } = make(true, 2);
    const tiles = layout(mg, [16, 15]);
    mg.fitSignInUsernames();
    assert.ok('usernameFits' in tiles[0].dataset && !('usernameFits' in tiles[1].dataset), '16 fits, 15 does not');
    mg.cleanup();
});

test('a keyring tile with a tag row under the name: its spare is counted under the tags', () => {
    const { mg } = make(true);
    const tiles = layout(mg, [0, 17, 17], { tag: [18, 0, 18] });
    // tile 0: tall (tags), no spare; tile 1 one-line name, 17 spare; tile 2 has tags AND 17 below them
    mg.fitSignInUsernames();
    const got = tiles.map((x) => ('usernameFits' in x.dataset ? 'y' : 'n')).join('');
    assert.ok(got === 'nyy', `flags ${got}`);
    // the same tag row with only 17px below the name (so under the tags nothing is left): not flagged
    const b = make(true);
    const bt = layout(b.mg, [0, 0, 0], { tag: [18, 0, 0] });
    // tile 0's bottom is 118 (tags 18, 0 spare): below the name there is 18, none below the tags
    b.mg.fitSignInUsernames();
    assert.ok(!('usernameFits' in bt[0].dataset), 'a tag row is not spare');
    mg.cleanup(); b.mg.cleanup();
});

test('an absolute child (a remote badge) is out of the flow and does not count', () => {
    const { mg } = make(true);
    const tiles = layout(mg, [20, 20, 20]);
    const badge = document.createElement('span');
    badge.dataset.pos = 'absolute';
    badge.getBoundingClientRect = () => ({ top: 90, left: 70, right: 80, width: 10, height: 10, bottom: 119 });
    tiles[0].appendChild(badge);
    mg.fitSignInUsernames();
    assert.ok('usernameFits' in tiles[0].dataset, 'the badge is skipped');
    mg.cleanup();
});

test('two measures in a row give the same flags (reads come after the clear)', () => {
    const { mg } = make(true);
    const tiles = layout(mg, [16, 20, 5]);
    const flags = () => tiles.map((x) => ('usernameFits' in x.dataset ? 'y' : 'n')).join('');
    mg.fitSignInUsernames();
    const first = flags();
    mg.fitSignInUsernames();
    assert.ok(first === 'yyn' && flags() === first, `first ${first}, second ${flags()}`);
    mg.cleanup();
});

test('not short: every flag is cleared and none set', () => {
    const { mg } = make(false);
    const tiles = layout(mg, [40, 40, 40]);
    tiles[0].dataset.usernameFits = '';
    mg.fitSignInUsernames();
    assert.ok(tiles.every((t) => !('usernameFits' in t.dataset)), 'no flags');
    mg.cleanup();
});

test('no layout (zero rects): no flags, so the line stays hidden', () => {
    const { mg } = make(true);
    const tiles = Array.from(mg.gameContainer.querySelectorAll('.signin-tile'));
    mg.fitSignInUsernames();
    assert.ok(tiles.every((t) => !('usernameFits' in t.dataset)), 'no flags');
    mg.cleanup();
});

test('the measure starts from a clean baseline: a stale flag does not survive a tile that lost its spare', () => {
    const { mg } = make(true);
    const tiles = layout(mg, [20, 20, 20]);
    mg.fitSignInUsernames();
    assert.ok(tiles.every((t) => 'usernameFits' in t.dataset), 'all fit');
    layout(mg, [20, 0, 20]);
    mg.fitSignInUsernames();
    assert.ok(!('usernameFits' in tiles[1].dataset) && 'usernameFits' in tiles[0].dataset, 'only the first and last');
    mg.cleanup();
});

test('again: one more measure on the next frame and no more (no loop)', () => {
    const { mg, frames, flush } = make(true);
    layout(mg, [20, 20, 20]);
    frames.length = 0;
    let reads = 0;
    const t0 = mg.gameContainer.querySelector('.signin-tile');
    const rect = t0.getBoundingClientRect;
    t0.getBoundingClientRect = () => { reads++; return rect(); };
    mg.fitSignInUsernames({ again: true });
    assert.ok(reads === 1 && frames.length === 1, `one read and one queued frame (reads ${reads}, frames ${frames.length})`);
    flush();
    assert.ok(reads === 2 && frames.length === 0, `second read, nothing queued (reads ${reads}, frames ${frames.length})`);
    mg.cleanup();
});

test('a resize event measures; a rebuild of the form measures', () => {
    const { mg, flush } = make(true);
    const tiles = layout(mg, [20, 20, 20]);
    window.dispatchEvent(new window.Event('resize'));
    assert.ok('usernameFits' in tiles[0].dataset, 'resize sets the flags');
    for (const t of tiles) delete t.dataset.usernameFits;
    mg.renderSignInForm({ quiet: true });
    assert.ok('usernameFits' in tiles[0].dataset, 'the form render sets the flags');
    flush();
    mg.cleanup();
});

// The frame snap also reads tile rects, so these count calls of the method itself
const spy = (mg) => {
    const calls = { n: 0 };
    const orig = mg.fitSignInUsernames.bind(mg);
    mg.fitSignInUsernames = (o) => { calls.n++; return orig(o); };
    return calls;
};

test('a queued frame on a detached screen measures nothing', () => {
    const { mg, flush } = make(true);
    layout(mg, [20, 20, 20]);
    mg.fitSignInUsernames({ again: true });
    const calls = spy(mg);
    Object.defineProperty(mg.gameContainer, 'isConnected', { value: false, configurable: true });
    flush();
    assert.ok(calls.n === 0, `calls after detach ${calls.n}`);
    mg.cleanup();
});

test('cleanup removes the resize listener: a resize after it measures nothing', () => {
    const { mg } = make(true);
    layout(mg, [20, 20, 20]);
    const calls = spy(mg);
    window.dispatchEvent(new window.Event('resize'));
    assert.ok(calls.n === 1, `a live resize measures (${calls.n})`);
    mg.cleanup();
    calls.n = 0;
    window.dispatchEvent(new window.Event('resize'));
    assert.ok(calls.n === 0, `calls after cleanup ${calls.n}`);
});

test('when the pixel font arrives the tiles are measured again, only while connected', async () => {
    // fonts.ready is already resolved (nothing requested yet); only loading GNF itself waits for it
    let resolve;
    const ready = new Promise((r) => { resolve = r; });
    const asked = [];
    Object.defineProperty(document, 'fonts', { value: { ready: Promise.resolve(), load: (f) => { asked.push(f); return ready; } }, configurable: true });
    const a = make(true);
    const b = make(true);
    layout(a.mg, [20, 20, 20]);
    layout(b.mg, [20, 20, 20]);
    const ca = spy(a.mg);
    const cb = spy(b.mg);
    // make() rewrites the body, so the first screen's container is detached: say which is which
    Object.defineProperty(a.mg.gameContainer, 'isConnected', { value: true, configurable: true });
    Object.defineProperty(b.mg.gameContainer, 'isConnected', { value: false, configurable: true });
    await Promise.resolve(); await Promise.resolve();
    assert.ok(ca.n === 0 && cb.n === 0, `nothing is measured before GNF lands (${ca.n}, ${cb.n})`);
    assert.ok(asked.length === 2 && asked.every((f) => /GNF/.test(f)), `GNF itself is loaded (${asked})`);
    resolve();
    await ready;
    await Promise.resolve();
    assert.ok(ca.n === 1, `a connected screen is measured once (${ca.n})`);
    assert.ok(cb.n === 0, `a detached screen is not measured (${cb.n})`);
    delete document.fonts;
    a.mg.cleanup(); b.mg.cleanup();
});

test('no document.fonts, or a GNF load that rejects, opens the screen without an error', async () => {
    const errors = [];
    const onRej = (e) => errors.push(e);
    process.on('unhandledRejection', onRej);
    delete document.fonts;
    const a = make(true);
    Object.defineProperty(document, 'fonts', { value: { ready: Promise.resolve(), load: () => Promise.reject(new Error('no font')) }, configurable: true });
    const b = make(true);
    await new Promise((r) => setTimeout(r, 0));
    process.off('unhandledRejection', onRej);
    assert.ok(errors.length === 0, `no unhandled rejection (${errors.length})`);
    assert.ok(!!a.mg.gameContainer && !!b.mg.gameContainer, 'both screens opened');
    delete document.fonts;
    a.mg.cleanup(); b.mg.cleanup();
});
