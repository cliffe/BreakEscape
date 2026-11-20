// UX slice 4 R1 (M3, m2): the inventory strip at phone width and its hover label.
// - the strip shows a "more" cue at its right edge while slots are out of view, which
//   scrolls a page on (or back to the start at the end); a slot added for a take is
//   scrolled into view; the strip's scrollbar is the shared pixel-art .pixel-scroll;
// - a change while the pointer rests on a tray item (a wearable put on or taken off)
//   sets the hover label again, so it never reads "(worn)" for an item taken off.
// Run with: node --test test/js/inventory-tray-narrow.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug']) console[k] = () => {};

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const root = join(js, '../../..');
const dir = mkdtempSync(join(tmpdir(), 'inventory-tray-narrow-'));
const stub = (out, code) => writeFileSync(join(dir, out), code);
stub('rooms-stub.mjs', 'export const rooms = {};');
stub('ink-stub.mjs', 'export default class InkEngine {}');
stub('config-stub.mjs', "export const CSRF_TOKEN = 'x';");
stub('info-label-stub.mjs', 'export function setHudLabel(t) { globalThis.__labels.push(t); } export function clearHudLabel() { globalThis.__labels.push(null); }');
stub('guard-stub.mjs', 'export function inventoryBlockedByForcedMinigame() { return false; }');
stub('consumables-stub.mjs', 'export function markObjectConsumed() {}');
let code = readFileSync(join(js, 'systems/inventory.js'), 'utf8');
for (const [a, b] of [
    ["'../core/rooms.js'", "'./rooms-stub.mjs'"],
    ["'./ink/ink-engine.js'", "'./ink-stub.mjs'"],
    ["'../config.js'", "'./config-stub.mjs'"],
    ["'../ui/info-label.js'", "'./info-label-stub.mjs'"],
    ["'./forced-minigame-guard.js'", "'./guard-stub.mjs'"],
    ["'./consumables.js'", "'./consumables-stub.mjs'"],
]) {
    assert.ok(code.includes(a), `inventory.js no longer imports ${a}`);
    code = code.replace(a, b);
}
writeFileSync(join(dir, 'inventory.mjs'), code);

const dom = new JSDOM('<!doctype html><html><body><div id="inventory-container" class="pixel-scroll"></div></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.MutationObserver = dom.window.MutationObserver;
globalThis.__labels = [];
const inv = await import(pathToFileURL(join(dir, 'inventory.mjs')).href);

// JSDOM has no layout: give the strip a fixed size and a scroll position to read
function strip({ scrollWidth, clientWidth, scrollLeft = 0 }) {
    const c = document.getElementById('inventory-container');
    let left = scrollLeft;
    Object.defineProperty(c, 'scrollWidth', { configurable: true, get: () => scrollWidth });
    Object.defineProperty(c, 'clientWidth', { configurable: true, get: () => clientWidth });
    Object.defineProperty(c, 'scrollLeft', { configurable: true, get: () => left, set: (v) => { left = Math.max(0, Math.min(v, scrollWidth - clientWidth)); } });
    c.scrollBy = ({ left: dx }) => { c.scrollLeft = left + dx; };
    c.scrollTo = ({ left: x }) => { c.scrollLeft = x; };
    return c;
}

test('trayOverflowSide: none when everything fits, right while more is to the right, left at the end', () => {
    assert.equal(inv.trayOverflowSide(null), null);
    assert.equal(inv.trayOverflowSide({ scrollWidth: 390, clientWidth: 390, scrollLeft: 0 }), null);
    assert.equal(inv.trayOverflowSide({ scrollWidth: 504, clientWidth: 390, scrollLeft: 0 }), 'right');
    assert.equal(inv.trayOverflowSide({ scrollWidth: 504, clientWidth: 390, scrollLeft: 50 }), 'right');
    assert.equal(inv.trayOverflowSide({ scrollWidth: 504, clientWidth: 390, scrollLeft: 114 }), 'left');
});

test('the "more" cue shows while slots are out of view, and a tap scrolls on, then back', () => {
    const c = strip({ scrollWidth: 390, clientWidth: 390 });
    assert.equal(inv.updateTrayOverflow(), null);
    let btn = document.getElementById('inventory-more');
    assert.ok(btn, 'the cue exists beside the strip');
    assert.equal(btn.hidden, true, 'hidden while everything fits');
    assert.equal(c.classList.contains(inv.TRAY_OVERFLOW_CLASS), false);

    strip({ scrollWidth: 504, clientWidth: 390 });
    assert.equal(inv.updateTrayOverflow(), 'right');
    btn = document.getElementById('inventory-more');
    assert.equal(btn.hidden, false);
    assert.equal(btn.dataset.side, 'right');
    assert.equal(btn.getAttribute('aria-label'), 'More items');
    assert.equal(btn.tagName, 'BUTTON', 'a real button, so a tap or Enter works');
    assert.ok(c.classList.contains(inv.TRAY_OVERFLOW_CLASS), 'room at the end so the last slot clears the cue');

    btn.click();
    assert.equal(c.scrollLeft, 114, 'one tap scrolls on to the end here');
    assert.equal(btn.dataset.side, 'left');
    assert.equal(btn.getAttribute('aria-label'), 'Back to the first items');
    btn.click();
    assert.equal(c.scrollLeft, 0, 'and back to the start');
    assert.equal(btn.dataset.side, 'right');
});

test('a slot added at the end is scrolled fully into view', () => {
    const c = strip({ scrollWidth: 504, clientWidth: 390 });
    c.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const s = document.createElement('div');
        s.className = 'inventory-slot';
        c.appendChild(s);
    }
    inv.revealTraySlot(c.lastElementChild);
    assert.equal(c.scrollLeft, 114);
    assert.equal(document.getElementById('inventory-more').dataset.side, 'left');
    // A slot that is not in the strip is left alone
    assert.doesNotThrow(() => inv.revealTraySlot(document.createElement('div')));
});

test('the strip uses the pixel-art scrollbar, with no smooth scrollbar rules of its own', () => {
    const view = readFileSync(join(root, 'app/views/break_escape/games/show.html.erb'), 'utf8');
    assert.match(view, /<div id="inventory-container" class="pixel-scroll"><\/div>/);
    for (const f of ['hud.css', 'inventory.css']) {
        const css = readFileSync(join(js, '../css', f), 'utf8');
        assert.doesNotMatch(css, /#inventory-container::-webkit-scrollbar/, f);
    }
    const themes = readFileSync(join(js, '../css/ui-themes.css'), 'utf8');
    // Phone width: the portrait group is the ring alone
    const narrow = themes.slice(themes.indexOf('@media (max-width: 480px)'));
    assert.match(narrow, /#player-hud-buttons[^{]*\{\s*width: 80px;/);
    // The cue is pixel art: square corners, the theme's button skin
    const cue = themes.slice(themes.indexOf('#inventory-more {'), themes.indexOf('#inventory-more[hidden]'));
    assert.match(cue, /border-radius: 0;/);
    assert.match(cue, /border-image-source: var\(--ui-small-button-image/);
});

test('a change while the pointer rests on a tray item sets the hover label again (R1 m2)', () => {
    let worn = true;
    window.wearables = { isWorn: () => worn };
    const hovered = { scenarioData: { id: 'vest', name: 'Hi-vis vest' }, matches: (sel) => sel === ':hover' };
    const other = { scenarioData: { id: 'pen', name: 'Pen' }, matches: () => false };
    window.inventory = { items: [other, hovered] };
    try {
        globalThis.__labels.length = 0;
        inv.refreshInventoryTray();
        assert.deepEqual(globalThis.__labels, ['Hi-vis vest (worn)']);
        worn = false;
        inv.refreshInventoryTray();
        assert.deepEqual(globalThis.__labels, ['Hi-vis vest (worn)', 'Hi-vis vest'], 'no stale "(worn)" after it comes off');
        // Nothing hovered: the label is left alone
        hovered.matches = () => false;
        inv.refreshInventoryTray();
        assert.equal(globalThis.__labels.length, 2);
    } finally {
        delete window.wearables;
        delete window.inventory;
    }
});

test('on a screen that cannot hover, a tray refresh shows no label for the last-tapped item (R2 m1)', () => {
    // Phones keep :hover on the last-tapped element, and there setHudLabel shows a brief label
    window.wearables = { isWorn: () => true };
    const tapped = { scenarioData: { id: 'vest', name: 'Hi-vis vest' }, matches: (sel) => sel === ':hover' };
    window.inventory = { items: [tapped] };
    const had = window.matchMedia;
    window.matchMedia = (q) => ({ matches: q === '(hover: none)', media: q });
    try {
        globalThis.__labels.length = 0;
        inv.refreshInventoryTray();
        assert.deepEqual(globalThis.__labels, [], 'no label on a refresh');
        // A screen that can hover still gets it
        window.matchMedia = (q) => ({ matches: false, media: q });
        inv.refreshInventoryTray();
        assert.deepEqual(globalThis.__labels, ['Hi-vis vest (worn)']);
    } finally {
        window.matchMedia = had;
        delete window.wearables;
        delete window.inventory;
    }
});
