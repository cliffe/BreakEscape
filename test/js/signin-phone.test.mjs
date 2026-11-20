// PC sign-in on a phone: the username line under each account tile stays (cut with an ellipsis),
// and the password field is scrolled into view on focus and on visualViewport resize so the
// on-screen keyboard does not cover it, the error line or Sign in. Listeners go at cleanup().
// Run with: node --max-old-space-size=2048 test/js/signin-phone.test.mjs
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
const dir = mkdtempSync(join(tmpdir(), 'signin-phone-'));
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

// ── CSS pins ────────────────────────────────────────────────────────────────
const rule = (selector) => {
    const i = css.indexOf(selector + ' {');
    assert.ok(i >= 0, `rule ${selector} exists`);
    return css.slice(i, css.indexOf('}', i));
};

test('CSS: the username line is no longer hidden on a compact (phone) frame', () => {
    assert.ok(!/\.pc-monitor\[data-compact\]\s+\.signin-username\s*[,{]/.test(css), 'no plain compact rule that hides the line');
    assert.ok(!/\.pc-monitor\[data-compact\]\s+\.signin-username[^{]*\{[^}]*display:\s*none/.test(css), 'compact does not display:none the line');
});

test('CSS: compact and not short shows the username line on one line with an ellipsis', () => {
    const r = rule('.pc-monitor[data-compact]:not([data-short]) .signin-username');
    assert.ok(/display:\s*block/.test(r), 'shown');
    assert.ok(/white-space:\s*nowrap/.test(r), 'one line');
    assert.ok(/overflow:\s*hidden/.test(r), 'clipped');
    assert.ok(/text-overflow:\s*ellipsis/.test(r), 'ellipsis');
    assert.ok(/max-width:\s*100%/.test(r), 'no wider than the tile');
});

test('CSS: the short frame still hides the username line, and the line keeps GNF 16px', () => {
    assert.ok(/display:\s*none/.test(rule('.pc-monitor[data-short] .signin-username')), 'short hides it');
    const base = rule('.signin-username');
    assert.ok(/font-size:\s*16px/.test(base), '16px');
    const tile = rule('.pc-monitor[data-compact] .signin-tile');
    assert.ok(/width:\s*84px/.test(tile), 'compact tile width unchanged');
});

// ── Behaviour ───────────────────────────────────────────────────────────────
const TILES = [{ username: 'sokafor', displayName: 'Sam Okafor', portrait: null, avatar: null }];

function fakeViewport() {
    const vv = { added: [], removed: [], handlers: new Set() };
    vv.addEventListener = (type, h) => { vv.added.push(type); vv.handlers.add(h); };
    vv.removeEventListener = (type, h) => { vv.removed.push(type); vv.handlers.delete(h); };
    vv.fire = () => [...vv.handlers].forEach((h) => h({ type: 'resize' }));
    return vv;
}

function open({ touch }) {
    document.body.innerHTML = '<div id="mg"></div>';
    const scrolls = [];
    dom.window.HTMLElement.prototype.scrollIntoView = function (opts) { scrolls.push({ el: this, opts }); };
    window.matchMedia = (q) => ({ matches: touch && /pointer:\s*coarse/.test(q), media: q });
    const vv = fakeViewport();
    window.visualViewport = vv;
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    window.gameAlert = () => {};
    window.playUISound = () => {};
    window.pcSessions = { signIn: async () => ({ ok: false, reason: 'wrong', message: 'no', attemptsLeft: 3 }) };
    const mg = new PasswordMinigame(document.getElementById('mg'), {
        title: 'Hot desk PC', lockable: { scenarioData: { id: 'hot_desk' } }, type: 'item',
        signIn: { pcId: 'hot_desk', pcName: 'Hot desk PC', picker: 'accounts', tiles: TILES, current: null },
        showPostit: false
    });
    window.MinigameFramework.currentMinigame = mg;
    mg.init();
    mg.start();
    scrolls.length = 0; // the opening focus is not under test
    return { mg, scrolls, vv };
}
const focusField = (mg) => { mg.passwordField.dispatchEvent(new dom.window.Event('blur')); mg.passwordField.focus(); mg.passwordField.dispatchEvent(new dom.window.Event('focus')); };

test('touch: focusing the password field scrolls it to the centre, nearest horizontally', () => {
    const { mg, scrolls } = open({ touch: true });
    focusField(mg);
    assert.ok(scrolls.length >= 1, 'scrollIntoView called');
    assert.ok(scrolls[0].el === mg.passwordField, 'on the password field itself');
    assert.ok(scrolls[0].opts.block === 'center', 'block center');
    assert.ok(scrolls[0].opts.inline === 'nearest', 'no sideways jump');
    mg.cleanup();
});

test('touch: a visualViewport resize re-scrolls only while the field has focus', () => {
    const { mg, scrolls, vv } = open({ touch: true });
    assert.ok(vv.added.includes('resize') && vv.handlers.size === 1, 'one resize listener on visualViewport');
    mg.passwordField.blur();
    vv.fire();
    assert.ok(scrolls.length === 0, 'unfocused: no scroll');
    mg.passwordField.focus();
    scrolls.length = 0;
    vv.fire();
    assert.ok(scrolls.length === 1 && scrolls[0].el === mg.passwordField, 'focused: re-scrolled');
    mg.cleanup();
});

test('touch: cleanup removes the visualViewport listener (no leak)', () => {
    const { mg, vv } = open({ touch: true });
    assert.ok(vv.handlers.size === 1, 'added');
    mg.cleanup();
    assert.ok(vv.handlers.size === 0, 'handler set empty after cleanup');
    assert.ok(vv.removed.includes('resize'), 'removeEventListener called with resize');
});

test('touch: after cleanup the field focus no longer scrolls', () => {
    const { mg, scrolls } = open({ touch: true });
    mg.cleanup();
    focusField(mg);
    assert.ok(scrolls.length === 0, 'no scroll after cleanup');
});

test('desktop (fine pointer): focus does not scroll and no visualViewport listener is added', () => {
    const { mg, scrolls, vv } = open({ touch: false });
    focusField(mg);
    vv.fire();
    assert.ok(scrolls.length === 0, 'scrollIntoView not called');
    assert.ok(vv.added.length === 0, 'no listener added');
    mg.cleanup();
});

test('the password field sits inside the PC screen scroller, not a page scroller', () => {
    const pcCss = readFileSync(join(here, '../../public/break_escape/css/pc-monitor.css'), 'utf8');
    const i = pcCss.indexOf('.pc-monitor-screen > .minigame-game-container {');
    assert.ok(i >= 0 && /overflow-y:\s*auto/.test(pcCss.slice(i, pcCss.indexOf('}', i))), 'the monitor screen scrolls its own content');
});
