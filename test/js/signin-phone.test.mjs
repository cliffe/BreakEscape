// PC sign-in on a phone: the username line under each account tile stays (cut with an ellipsis),
// and while a sign-in field has focus and a keyboard has shrunk the visual viewport, the lowest of
// the message line and Sign in is revealed once (bottom padding added, then removed, scrollY reset).
// Pinch-zoom is ignored, the Other user username field is covered, listeners go at cleanup().
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

const INNER = 844;
let activeLayout = null;
function fakeViewport(over = {}) {
    const vv = { added: [], removed: [], handlers: new Set(), height: INNER, offsetTop: 0, scale: 1, ...over };
    vv.addEventListener = (type, h) => { vv.added.push(type); vv.handlers.add(h); };
    vv.removeEventListener = (type, h) => { vv.removed.push(type); vv.handlers.delete(h); };
    vv.fire = () => [...vv.handlers].forEach((h) => h({ type: 'resize' }));
    return vv;
}

function open() {
    activeLayout = null;
    document.body.innerHTML = '<div id="mg"></div>';
    const scrolls = [];
    dom.window.HTMLElement.prototype.scrollIntoView = function (opts) {
        scrolls.push({ el: this, opts });
        if (activeLayout) activeLayout.scrollNearest(this, opts);
    };
    const frames = [];
    window.requestAnimationFrame = (cb) => { frames.push(cb); return frames.length; };
    const flush = () => { while (frames.length) frames.shift()(); };
    window.innerHeight = INNER;
    const scrollTos = [];
    window.scrollTo = (x, y) => { scrollTos.push([x, y]); win.scrollY = y; };
    const win = window;
    win.scrollY = 0;
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
    flush();
    scrolls.length = 0; // the opening focus is not under test
    scrollTos.length = 0;
    return { mg, scrolls, vv, flush, scrollTos };
}
const passwordInput = (mg) => mg.passwordField.dispatchEvent(new window.Event('input', { bubbles: true }));
const rectBottom = (el, bottom) => { el.getBoundingClientRect = () => ({ top: bottom - 40, bottom, left: 0, right: 100, width: 100, height: 40 }); };
// A fake layout with rects: the panel's bottom is fixed at P (drawn px); the targets' bottoms move up
// as the panel scrolls. scrollNearest follows the browser's rule for block 'nearest': the target's
// bottom must end at or above P minus the panel's scroll-padding (inline value times the zoom), and
// the panel can only scroll as far as its bottom padding (times the zoom) allows.
function lay(mg, { submit, msg = 0, P = 700, z = 1, panelTop = P - 40, field = null, ufield = null }) {
    const panel = mg.gameContainer;
    const L = { scroll: 0, base: new Map([[mg.submitBtn, submit], [mg.signInMessageEl, msg]]), P, z };
    const rect = (bottom) => ({ top: bottom - 40, bottom, left: 0, right: 100, width: 100, height: 40 });
    panel.getBoundingClientRect = () => ({ ...rect(P), top: panelTop });
    // The password field: `field` is its [top, bottom] at scroll 0; by default it sits inside the panel
    const fieldBase = field || [panelTop + 5, panelTop + 37];
    const pf = mg.passwordField;
    const fs = () => (field ? L.scroll : 0); // a default field stays put; a given one scrolls with the content
    pf.getBoundingClientRect = () => ({ top: fieldBase[0] - fs(), bottom: fieldBase[1] - fs(), left: 0, right: 100, width: 100, height: 32 });
    // the username field (Other user): inside the panel and still by default; a given [top, bottom] scrolls with the content
    const uBase = ufield || [panelTop + 5, panelTop + 37];
    const uf = mg.usernameField;
    const us = () => (ufield ? L.scroll : 0);
    uf.getBoundingClientRect = () => ({ top: uBase[0] - us(), bottom: uBase[1] - us(), left: 0, right: 100, width: 100, height: 32 });
    L.fieldTop = () => fieldBase[0] - fs();
    L.fieldBottom = () => fieldBase[1] - fs();
    L.uFieldTop = () => uBase[0] - us();
    L.uFieldBottom = () => uBase[1] - us();
    L.panelTop = panelTop;
    if (z !== 1) panel.currentCSSZoom = z;
    for (const [el, b] of L.base) el.getBoundingClientRect = () => rect(L.base.get(el) - L.scroll);
    L.bottomOf = (el) => L.base.get(el) - L.scroll;
    L.scrollNearest = (el, opts) => {
        const px = (v) => (parseFloat(v) || 0) * z;
        if ((el === pf || el === uf) && opts && opts.block === 'start') {
            // block start: the field's top goes to the panel's top, within the panel's scroll range
            const max = px(panel.style.paddingBottom);
            L.scroll = Math.max(0, Math.min((el === pf ? fieldBase[0] : uBase[0]) - panelTop, max));
            return;
        }
        if (!L.base.has(el)) return;
        const limit = P - px(panel.style.scrollPaddingBottom);
        const bottom = L.bottomOf(el);
        if (bottom <= limit) return;
        const room = Math.max(0, px(panel.style.paddingBottom) - L.scroll);
        L.scroll += Math.min(bottom - limit, room);
    };
    activeLayout = L;
    return L;
}
const focusOn = (field) => { field.focus(); }; // jsdom fires the real focus and blur events
const keyboard = (vv, h = 544) => { vv.height = h; };

test('keyboard up: Sign in is the lowest, padding is added and Sign in is revealed once, nearest', () => {
    const { mg, scrolls, vv, flush } = open();
    const L = lay(mg, { submit: 700, msg: 650 });
    mg.signInMessageEl.textContent = '';
    focusOn(mg.passwordField); flush();
    assert.ok(scrolls.length === 0, 'focus with no keyboard up reveals nothing');
    keyboard(vv); vv.fire();
    assert.ok(scrolls.length === 0, 'nothing is measured before the animation frame');
    flush();
    assert.ok(scrolls.length === 1, `exactly one reveal (got ${scrolls.length})`);
    assert.ok(scrolls[0].el === mg.submitBtn && scrolls[0].opts.block === 'nearest', 'Sign in, block nearest');
    // the panel's bottom (700) is 156 below the keyboard edge (544), plus an 8px margin
    assert.ok(mg.gameContainer.style.paddingBottom === '164px', `padding is the panel's part under the keyboard (got ${mg.gameContainer.style.paddingBottom})`);
    assert.ok(mg.gameContainer.style.scrollPaddingBottom === '164px', 'scroll-padding matches so the nearest edge has a target');
    assert.ok(L.bottomOf(mg.submitBtn) <= 544 - 8, `Sign in ends above the keyboard (bottom ${L.bottomOf(mg.submitBtn)})`);
    mg.cleanup();
});

test('keyboard up: a lower message line is the one revealed', () => {
    const { mg, scrolls, vv, flush } = open();
    const L = lay(mg, { submit: 600, msg: 660 });
    mg.signInMessageEl.textContent = 'Incorrect username or password. 2 attempts left.';
    focusOn(mg.passwordField); keyboard(vv); vv.fire(); flush();
    assert.ok(scrolls.length === 1 && scrolls[0].el === mg.signInMessageEl, 'the message line');
    assert.ok(mg.gameContainer.style.paddingBottom === '164px', `padding from the panel (got ${mg.gameContainer.style.paddingBottom})`);
    assert.ok(L.bottomOf(mg.signInMessageEl) <= 544 - 8, `the message ends above the keyboard (bottom ${L.bottomOf(mg.signInMessageEl)})`);
    mg.cleanup();
});

test('keyboard up: an empty message line does not count even when it is lower', () => {
    const { mg, scrolls, vv, flush } = open();
    rectBottom(mg.submitBtn, 600); rectBottom(mg.signInMessageEl, 660);
    mg.signInMessageEl.textContent = '';
    focusOn(mg.passwordField); keyboard(vv); vv.fire(); flush();
    assert.ok(scrolls.length === 1 && scrolls[0].el === mg.submitBtn, 'Sign in');
    mg.cleanup();
});

test('keyboard up and already visible: one reveal, no padding', () => {
    const { mg, scrolls, vv, flush } = open();
    rectBottom(mg.submitBtn, 500); mg.signInMessageEl.textContent = '';
    focusOn(mg.passwordField); keyboard(vv); vv.fire(); flush();
    assert.ok(scrolls.length === 1, 'revealed once (nearest is a no-op on screen)');
    assert.ok(mg.gameContainer.style.paddingBottom === '', 'no padding needed');
    mg.cleanup();
});

test('keyboard closes: padding is removed and window scroll drift is put back to 0', () => {
    const { mg, vv, flush, scrollTos } = open();
    lay(mg, { submit: 700 }); mg.signInMessageEl.textContent = '';
    mg.gameContainer.style.paddingBottom = '3px';
    focusOn(mg.passwordField); keyboard(vv); vv.fire(); flush();
    assert.ok(mg.gameContainer.style.paddingBottom === '167px', `added on top of the existing 3px (got ${mg.gameContainer.style.paddingBottom})`);
    window.scrollY = 120; // iOS pan drift
    vv.height = INNER; vv.fire(); flush();
    assert.ok(mg.gameContainer.style.paddingBottom === '3px', `restored to the earlier value (got ${mg.gameContainer.style.paddingBottom})`);
    assert.ok(mg.gameContainer.style.scrollPaddingBottom === '', 'scroll-padding removed');
    assert.ok(window.scrollY === 0 && scrollTos.length === 1 && scrollTos[0][1] === 0, 'scrollTo(0, 0) called');
    mg.cleanup();
});

test('blur with the keyboard up: padding is removed and scrollY reset', () => {
    const { mg, vv, flush } = open();
    lay(mg, { submit: 700 }); mg.signInMessageEl.textContent = '';
    focusOn(mg.passwordField); keyboard(vv); vv.fire(); flush();
    assert.ok(mg.gameContainer.style.paddingBottom === '164px', 'padding on');
    window.scrollY = 80;
    mg.passwordField.blur(); flush();
    assert.ok(mg.gameContainer.style.paddingBottom === '', 'padding off after blur');
    assert.ok(window.scrollY === 0, 'scrollY reset');
    mg.cleanup();
});

test('pinch-zoom (scale !== 1) is ignored', () => {
    const { mg, scrolls, vv, flush } = open();
    rectBottom(mg.submitBtn, 700); mg.signInMessageEl.textContent = '';
    focusOn(mg.passwordField); vv.scale = 2; keyboard(vv, 400); vv.fire(); flush();
    assert.ok(scrolls.length === 0, 'no reveal');
    assert.ok(mg.gameContainer.style.paddingBottom === '', 'no padding');
    mg.cleanup();
});

test('resize with no field focused does nothing', () => {
    const { mg, scrolls, vv, flush } = open();
    rectBottom(mg.submitBtn, 700);
    mg.passwordField.blur(); mg.usernameField.blur(); flush();
    keyboard(vv); vv.fire(); flush();
    assert.ok(scrolls.length === 0 && mg.gameContainer.style.paddingBottom === '', 'nothing');
    mg.cleanup();
});

test('Other user: the username field gets the same reveal, once per focus and resize', () => {
    const { mg, scrolls, vv, flush } = open();
    const L = lay(mg, { submit: 720, P: 720 }); mg.signInMessageEl.textContent = '';
    focusOn(mg.usernameField); flush();
    keyboard(vv); vv.fire(); flush();
    assert.ok(scrolls.length === 1 && scrolls[0].el === mg.submitBtn, `one reveal of Sign in (got ${scrolls.length})`);
    assert.ok(mg.gameContainer.style.paddingBottom === '184px', `padded (got ${mg.gameContainer.style.paddingBottom})`);
    assert.ok(L.bottomOf(mg.submitBtn) <= 544 - 8, 'Sign in ends above the keyboard');
    scrolls.length = 0;
    focusOn(mg.passwordField); flush(); // Enter moves to the password: keyboard stays up
    assert.ok(scrolls.length === 1, `moving to the password field reveals once (got ${scrolls.length})`);
    mg.cleanup();
});

test('desktop: no shrunk viewport, so focus and resize do nothing', () => {
    const { mg, scrolls, vv, flush } = open();
    rectBottom(mg.submitBtn, 700);
    focusOn(mg.passwordField); vv.fire(); flush();
    assert.ok(scrolls.length === 0 && mg.gameContainer.style.paddingBottom === '', 'nothing');
    mg.cleanup();
});

test('cleanup removes the visualViewport listener and any padding', () => {
    const { mg, vv, flush } = open();
    assert.ok(vv.handlers.size === 1 && vv.added.includes('resize'), 'one resize listener');
    rectBottom(mg.submitBtn, 700); mg.signInMessageEl.textContent = '';
    focusOn(mg.passwordField); keyboard(vv); vv.fire(); flush();
    mg.cleanup();
    assert.ok(vv.handlers.size === 0 && vv.removed.includes('resize'), 'listener removed');
    assert.ok(mg.gameContainer.style.paddingBottom === '', 'padding removed');
});

test('after cleanup the field focus and resize no longer reveal', () => {
    const { mg, scrolls, vv, flush } = open();
    mg.cleanup();
    keyboard(vv); focusOn(mg.passwordField); vv.fire(); flush();
    assert.ok(scrolls.length === 0, 'no reveal after cleanup');
});

test('the Other user hint: "type name" (9 characters) on a compact tile, "type a name" as before elsewhere', () => {
    const src = readFileSync(join(js, 'minigames/password/password-minigame.js'), 'utf8');
    const m = src.match(/signin-other[^]*?<span class="signin-hint-long">([^<]*)<\/span><span class="signin-hint-short">([^<]*)<\/span>/);
    assert.ok(m, 'the Other user tile has a long and a short hint');
    assert.ok(m[1] === 'type a name', `desktop text is what it was (got "${m[1]}")`);
    assert.ok(m[2] === 'type name' && m[2].length <= 9, `compact hint is "${m[2]}"`);
    assert.ok(/\.pc-monitor\[data-compact\] \.signin-hint-long\s*\{[^}]*display:\s*none/.test(css), 'compact hides the long hint');
    assert.ok(/\.signin-hint-short\s*\{[^}]*display:\s*none/.test(css), 'the short hint is hidden by default');
});

// ── Where the target ends up (fake layout with rects) ───────────────────────
test('the keyboard fires resize several times: padding is the same each time and Sign in stays above it', () => {
    const { mg, vv, flush } = open();
    const L = lay(mg, { submit: 700 }); mg.signInMessageEl.textContent = '';
    focusOn(mg.passwordField);
    keyboard(vv); vv.fire(); flush();
    const first = mg.gameContainer.style.paddingBottom;
    vv.fire(); flush(); vv.fire(); flush();
    assert.ok(mg.gameContainer.style.paddingBottom === first, `padding unchanged (${first} then ${mg.gameContainer.style.paddingBottom})`);
    assert.ok(mg.gameContainer.style.scrollPaddingBottom === first, 'scroll-padding unchanged');
    assert.ok(first === '164px', `sized to the panel's hidden part (got ${first})`);
    assert.ok(L.bottomOf(mg.submitBtn) <= 544 - 8, `Sign in above the keyboard (bottom ${L.bottomOf(mg.submitBtn)})`);
    keyboard(vv, 444); vv.fire(); flush(); // the suggestion strip: a taller keyboard
    assert.ok(mg.gameContainer.style.paddingBottom === '264px', `a taller keyboard grows it from the base (got ${mg.gameContainer.style.paddingBottom})`);
    assert.ok(L.bottomOf(mg.submitBtn) <= 444 - 8, 'still above the taller keyboard');
    mg.cleanup();
});

test('a message set while the field is focused and the keyboard is up is revealed above the keyboard', () => {
    const { mg, scrolls, vv, flush } = open();
    const L = lay(mg, { submit: 600, msg: 690 });
    mg.signInMessageEl.textContent = '';
    focusOn(mg.passwordField); keyboard(vv); vv.fire(); flush();
    const before = scrolls.length;
    mg.setSignInMessage('Incorrect username or password. 2 attempts left.', 'error');
    flush();
    assert.ok(scrolls.length > before + 1, `the keyboard reveal ran again after the message (${scrolls.length - before} scrolls)`);
    assert.ok(scrolls[scrolls.length - 1].el === mg.signInMessageEl, 'the message is the last thing revealed');
    assert.ok(L.bottomOf(mg.signInMessageEl) <= 544 - 8, `the message ends above the keyboard (bottom ${L.bottomOf(mg.signInMessageEl)})`);
    mg.cleanup();
});

test('zoom 2 (--pc-ui-scale 2): padding and scroll-padding are in the panel\'s own pixels, so halved', () => {
    const { mg, vv, flush } = open();
    const L = lay(mg, { submit: 700, z: 2 }); mg.signInMessageEl.textContent = '';
    focusOn(mg.passwordField); keyboard(vv); vv.fire(); flush();
    assert.ok(mg.gameContainer.style.paddingBottom === '82px', `padding (got ${mg.gameContainer.style.paddingBottom})`);
    assert.ok(mg.gameContainer.style.scrollPaddingBottom === '82px', `scroll-padding (got ${mg.gameContainer.style.scrollPaddingBottom})`);
    assert.ok(L.bottomOf(mg.submitBtn) <= 544 - 8, `Sign in above the keyboard (bottom ${L.bottomOf(mg.submitBtn)})`);
    mg.cleanup();
});

test('a browser that resizes the layout for the keyboard: Sign in is revealed with no padding', () => {
    const { mg, scrolls, vv, flush } = open();
    lay(mg, { submit: 600 }); mg.signInMessageEl.textContent = '';
    focusOn(mg.passwordField); flush();
    window.innerHeight = 544; vv.height = 544; vv.fire(); flush();
    assert.ok(scrolls.length === 1 && scrolls[0].el === mg.submitBtn, `Sign in revealed once (got ${scrolls.length})`);
    assert.ok(mg.gameContainer.style.paddingBottom === '', 'no padding: the layout already has the range');
    window.innerHeight = INNER; vv.height = INNER; vv.fire(); flush();
    mg.cleanup();
});

// ── R3 fixes: rotation, keyboard close after a layout shrink, offsetTop, short landscape ──────────
test('Sign in above the edge and the message below it, no padding yet: the message is revealed above the keyboard', () => {
    const { mg, vv, flush } = open();
    const L = lay(mg, { submit: 530, msg: 590, P: 700, panelTop: 143, field: [300, 332] });
    mg.signInMessageEl.textContent = '';
    focusOn(mg.passwordField); keyboard(vv); vv.fire(); flush();
    assert.ok(mg.gameContainer.style.paddingBottom === '', 'Sign in is above the edge: no padding yet');
    mg.setSignInMessage('Incorrect username or password. 2 attempts left.', 'error');
    flush();
    assert.ok(mg.gameContainer.style.paddingBottom !== '', 'the message put the padding on');
    assert.ok(L.bottomOf(mg.signInMessageEl) <= 544 - 8, `the message ends above the keyboard (bottom ${L.bottomOf(mg.signInMessageEl)})`);
    assert.ok(L.fieldTop() >= L.panelTop, `the field stays in the panel (top ${L.fieldTop()}, panel ${L.panelTop})`);
    mg.cleanup();
});

test('the keyboard closing after a keyboard-up rotation clears the padding', () => {
    const { mg, vv, flush } = open();
    window.innerWidth = 390;
    focusOn(mg.passwordField); flush(); // portrait focus: focusH 844
    lay(mg, { submit: 300, msg: 340, P: 330, panelTop: 48 });
    mg.signInMessageEl.textContent = 'Incorrect.';
    window.innerWidth = 844; window.innerHeight = 390; vv.height = 150; // rotated, keyboard up
    vv.fire(); flush();
    assert.ok(mg.gameContainer.style.paddingBottom !== '', 'padding on while the keyboard is up');
    vv.height = 390; vv.fire(); flush(); // Back hides the keyboard, the field keeps focus
    assert.ok(mg.gameContainer.style.paddingBottom === '', `padding cleared (got "${mg.gameContainer.style.paddingBottom}")`);
    assert.ok(mg.gameContainer.style.scrollPaddingBottom === '', 'scroll-padding cleared');
    window.innerWidth = 1024; window.innerHeight = INNER;
    mg.cleanup();
});

test('a rotation changes innerWidth: the tall portrait height is not read as a keyboard layout shrink', () => {
    const { mg, scrolls, vv, flush } = open();
    window.innerWidth = 390;
    lay(mg, { submit: 300 }); mg.signInMessageEl.textContent = '';
    focusOn(mg.passwordField); flush();
    scrolls.length = 0;
    window.innerWidth = 844; window.innerHeight = 390; vv.height = 390; // rotated, no keyboard
    vv.fire(); flush();
    assert.ok(scrolls.length === 0, `no reveal after a plain rotation (got ${scrolls.length})`);
    window.innerWidth = 1024; window.innerHeight = INNER;
    mg.cleanup();
});

test('a visual viewport with a non-zero offsetTop (an iOS pan): the edge is offsetTop plus height', () => {
    const { mg, vv, flush } = open();
    const L = lay(mg, { submit: 700 }); mg.signInMessageEl.textContent = '';
    focusOn(mg.passwordField);
    vv.height = 444; vv.offsetTop = 100; vv.fire(); flush(); // edge 544 again
    assert.ok(mg.gameContainer.style.paddingBottom === '164px', `padded to the edge, not the height (got ${mg.gameContainer.style.paddingBottom})`);
    assert.ok(L.bottomOf(mg.submitBtn) <= 544 - 8, `Sign in above the keyboard (bottom ${L.bottomOf(mg.submitBtn)})`);
    mg.cleanup();
});

test('landscape 844x390: on focus and resize the field wins; a fresh error line then wins over it (m1)', () => {
    const { mg, scrolls, vv, flush } = open();
    // screen 48 to 330; field 198-230, Sign in 238-270, message 286-328 at scroll 0; keyboard edge 150
    const L = lay(mg, { submit: 270, msg: 328, P: 330, panelTop: 48, field: [198, 230] });
    mg.signInMessageEl.textContent = '';
    window.innerWidth = 844; window.innerHeight = 390;
    focusOn(mg.passwordField); flush();
    vv.height = 150; vv.fire(); flush();
    assert.ok(L.fieldTop() >= L.panelTop && L.fieldBottom() <= 150, `field wins on resize (top ${L.fieldTop()}, bottom ${L.fieldBottom()})`);
    scrolls.length = 0;
    mg.setSignInMessage('Incorrect username or password. 2 attempts left.', 'error');
    flush();
    assert.ok(L.bottomOf(mg.signInMessageEl) <= 150 - 8, `the error line ends 8px above the keyboard (bottom ${L.bottomOf(mg.signInMessageEl)})`);
    assert.ok(!scrolls.some((r) => r.opts && r.opts.block === 'start'), 'the field is not scrolled back over the error line');
    assert.ok(L.fieldTop() < L.panelTop, 'the field gives way to the error line (the decided trade-off)');
    // a resize of 0px or +6px (a QuickType row) re-pins the line; the field does not take the win back (R5 m1)
    vv.fire(); flush();
    assert.ok(L.bottomOf(mg.signInMessageEl) <= 150 - 8, `the line holds on a 0px resize (bottom ${L.bottomOf(mg.signInMessageEl)})`);
    assert.ok(L.fieldTop() < L.panelTop, `the field still gives way on a 0px resize (top ${L.fieldTop()})`);
    vv.height = 156; vv.fire(); flush();
    assert.ok(L.bottomOf(mg.signInMessageEl) <= 156 - 8 && L.bottomOf(mg.signInMessageEl) >= 156 - 8 - 40, `the line follows a +6px edge (bottom ${L.bottomOf(mg.signInMessageEl)})`);
    assert.ok(!scrolls.some((r) => r.opts && r.opts.block === 'start'), 'no scroll back to the field while the error is held');
    // typing hands the win back: the next resize puts the field at the top of the panel
    passwordInput(mg);
    vv.fire(); flush();
    assert.ok(L.fieldTop() >= L.panelTop, `field wins on the resize after an input event (top ${L.fieldTop()})`);
    window.innerWidth = 1024; window.innerHeight = INNER;
    mg.cleanup();
});

test('a keydown in the field also releases a held error line (R5 m1)', () => {
    const { mg, vv, flush } = open();
    const L = lay(mg, { submit: 270, msg: 328, P: 330, panelTop: 48, field: [198, 230] });
    mg.signInMessageEl.textContent = '';
    window.innerWidth = 844; window.innerHeight = 390;
    focusOn(mg.passwordField); flush();
    vv.height = 150; vv.fire(); flush();
    mg.setSignInMessage('Incorrect username or password. 2 attempts left.', 'error');
    flush();
    vv.fire(); flush();
    assert.ok(L.fieldTop() < L.panelTop, 'held through a resize');
    mg.passwordField.dispatchEvent(new window.Event('keydown', { bubbles: true }));
    vv.fire(); flush();
    assert.ok(L.fieldTop() >= L.panelTop, `field wins after a keydown (top ${L.fieldTop()})`);
    window.innerWidth = 1024; window.innerHeight = INNER;
    mg.cleanup();
});

test('focus moving to a field releases a held error line (R6 m1)', () => {
    const { mg, vv, flush } = open();
    lay(mg, { submit: 270, msg: 328, P: 330, panelTop: 48, field: [198, 230] });
    mg.signInMessageEl.textContent = '';
    window.innerWidth = 844; window.innerHeight = 390;
    focusOn(mg.passwordField); flush();
    vv.height = 150; vv.fire(); flush();
    mg.setSignInMessage('Incorrect username or password. 2 attempts left.', 'error');
    flush();
    assert.ok(mg._keyboardRevealState().errorHeld === true, 'the error line is held');
    mg.passwordField.dispatchEvent(new window.Event('focus'));
    assert.ok(mg._keyboardRevealState().errorHeld === false, 'a focus event releases the hold');
    window.innerWidth = 1024; window.innerHeight = INNER; vv.height = INNER;
    mg.cleanup();
});

test('cleanup clears the tallest-height map and the focus width (R5 m2)', () => {
    const { mg, vv, flush } = open();
    lay(mg, { submit: 300 }); mg.signInMessageEl.textContent = '';
    window.innerHeight = 844;
    focusOn(mg.passwordField); flush(); // tallest[innerWidth] = 844
    const st = mg._keyboardRevealState();
    assert.ok(st.tallest === 1 && st.focusW !== 0, `state held while focused (tallest ${st.tallest}, focusW ${st.focusW})`);
    mg.cleanup();
    const after = mg._keyboardRevealState();
    assert.ok(after.tallest === 0, `tallest cleared at cleanup (got ${after.tallest})`);
    assert.ok(after.focusW === 0, `focusW cleared at cleanup (got ${after.focusW})`);
    assert.ok(after.errorHeld === false, 'errorHeld cleared at cleanup');
    window.innerHeight = INNER; vv.height = INNER;
});

test('landscape 667x330 (edge 95): the attempts-left line is brought above the keyboard', () => {
    const { mg, vv, flush } = open();
    const L = lay(mg, { submit: 230, msg: 288, P: 290, panelTop: 48, field: [150, 182] });
    mg.signInMessageEl.textContent = '';
    window.innerWidth = 667; window.innerHeight = 330;
    focusOn(mg.passwordField); flush();
    vv.height = 95; vv.fire(); flush();
    mg.setSignInMessage('Incorrect username or password. 2 attempts left.', 'error');
    flush();
    assert.ok(L.bottomOf(mg.signInMessageEl) <= 95 - 8, `the line ends above the keyboard (bottom ${L.bottomOf(mg.signInMessageEl)})`);
    window.innerWidth = 1024; window.innerHeight = INNER;
    mg.cleanup();
});

test('portrait: the field moves with the content, Sign in is lifted, and the field is not scrolled to the top', () => {
    const { mg, scrolls, vv, flush } = open();
    // panel 143 to 700; the field sits low in the panel, Sign in at 600; keyboard edge 544
    const L = lay(mg, { submit: 600, msg: 0, P: 700, panelTop: 143, field: [300, 332] });
    mg.signInMessageEl.textContent = '';
    focusOn(mg.passwordField); flush();
    keyboard(vv); vv.fire(); flush();
    assert.ok(L.bottomOf(mg.submitBtn) <= 544 - 8, `Sign in is lifted above the keyboard (bottom ${L.bottomOf(mg.submitBtn)})`);
    assert.ok(L.fieldTop() === 300 - 64, `the field moved up with the content by 64 (top ${L.fieldTop()})`);
    assert.ok(!scrolls.some((r) => r.opts && r.opts.block === 'start'), 'no block start scroll while the field is inside the panel');
    mg.cleanup();
});

test('Other user: the username field wins on resize in landscape with a message already showing', () => {
    const { mg, vv, flush } = open();
    const L = lay(mg, { submit: 270, msg: 328, P: 330, panelTop: 48, ufield: [198, 230] });
    mg.signInMessageEl.textContent = 'Enter a username.';
    window.innerWidth = 844; window.innerHeight = 390;
    focusOn(mg.usernameField); flush();
    vv.height = 150; vv.fire(); flush();
    assert.ok(L.uFieldTop() >= L.panelTop && L.uFieldBottom() <= 150, `username field in view (top ${L.uFieldTop()}, bottom ${L.uFieldBottom()})`);
    window.innerWidth = 1024; window.innerHeight = INNER;
    mg.cleanup();
});

test('Other user: a fresh error line wins over the username field in landscape', () => {
    const { mg, vv, flush } = open();
    const L = lay(mg, { submit: 270, msg: 328, P: 330, panelTop: 48, ufield: [198, 230] });
    mg.signInMessageEl.textContent = '';
    window.innerWidth = 844; window.innerHeight = 390;
    focusOn(mg.usernameField); flush();
    vv.height = 150; vv.fire(); flush();
    mg.setSignInMessage('Enter a username.', 'error');
    flush();
    assert.ok(L.bottomOf(mg.signInMessageEl) <= 150 - 8, `the line ends above the keyboard (bottom ${L.bottomOf(mg.signInMessageEl)})`);
    window.innerWidth = 1024; window.innerHeight = INNER;
    mg.cleanup();
});

test('a panned visual viewport (offsetTop 50): the error line ends 8px above offsetTop plus height', () => {
    const { mg, vv, flush } = open();
    const L = lay(mg, { submit: 270, msg: 328, P: 330, panelTop: 48, field: [198, 230] });
    mg.signInMessageEl.textContent = '';
    window.innerWidth = 844; window.innerHeight = 390;
    focusOn(mg.passwordField); flush();
    vv.height = 100; vv.offsetTop = 50; vv.fire(); flush(); // edge 150
    mg.setSignInMessage('Incorrect username or password. 2 attempts left.', 'error');
    flush();
    assert.ok(L.bottomOf(mg.signInMessageEl) <= 150 - 8, `the line ends above the visible bottom (bottom ${L.bottomOf(mg.signInMessageEl)})`);
    window.innerWidth = 1024; window.innerHeight = INNER;
    mg.cleanup();
});

test('rotating back to a width seen earlier keeps the tallest height, so a shrunk layout is revealed (m2)', () => {
    const { mg, scrolls, vv, flush } = open();
    window.innerWidth = 390;
    lay(mg, { submit: 300 }); mg.signInMessageEl.textContent = '';
    focusOn(mg.passwordField); flush(); // portrait, innerHeight 844
    window.innerWidth = 844; window.innerHeight = 390; vv.height = 390; vv.fire(); flush(); // landscape, no keyboard
    scrolls.length = 0;
    window.scrollY = 40; // drift to be put back
    // rotate back with a browser that resizes the layout for the keyboard: innerHeight is already shrunk
    window.innerWidth = 390; window.innerHeight = 420; vv.height = 420; vv.fire(); flush();
    assert.ok(scrolls.length === 1 && scrolls[0].el === mg.submitBtn, `Sign in revealed after the rotation (got ${scrolls.length})`);
    assert.ok(window.scrollY === 0, 'window scroll drift put back before the reveal');
    assert.ok(mg.gameContainer.style.paddingBottom === '', 'no padding on the layout-shrunk path');
    window.innerWidth = 1024; window.innerHeight = INNER;
    mg.cleanup();
});

test('the layout grows taller while focused: the baseline rises with it', () => {
    const { mg, scrolls, vv, flush } = open();
    window.innerHeight = 700; // focus with the browser bar showing
    lay(mg, { submit: 300 }); mg.signInMessageEl.textContent = '';
    focusOn(mg.passwordField); flush();
    window.innerHeight = 844; vv.height = 844; vv.fire(); flush(); // bar hides
    scrolls.length = 0;
    window.innerHeight = 600; vv.height = 600; vv.fire(); flush(); // keyboard: shrunk by 244 from the tallest
    assert.ok(scrolls.length === 1, `the shrink is measured against 844, not 700 (got ${scrolls.length})`);
    window.innerHeight = INNER; vv.height = INNER;
    mg.cleanup();
});
