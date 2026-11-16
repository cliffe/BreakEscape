// The pick-one interaction menu (ui/interaction-menu.js, ui/menu-icons.js): the X in the
// title row, the scrolling list, keyboard and touch options, the modal stack (holdKeys),
// the tick that greys or closes it, the room_entered subscription and the 2x icons.
// Overlap menu plan 8.1, tests 37 to 46. The real modules run against jsdom.
// Run with: node test/js/interaction-menu-keys.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

for (const k of ['log', 'info', 'warn', 'debug']) console[k] = () => {};

const js = process.env.BE_JS_DIR || join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const alerts = [];
window.gameAlert = (...args) => alerts.push(args);

const imp = (p) => import(pathToFileURL(join(js, p)).href);
const menuMod = await imp('ui/interaction-menu.js');
const { showInteractionMenu, closeInteractionMenu, isInteractionMenuOpen, tickInteractionMenu, menuPlacement } = menuMod;
const stack = await imp('ui/modal-stack.js');
const { registerModal, openModalCount } = stack;
const icons = await imp('ui/menu-icons.js');

const $ = (sel) => document.querySelector(sel);
const items = () => [...document.querySelectorAll('#be-interaction-menu .be-im-item')];
function press(key, extra = {}, target = document.body) {
    const ev = new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra });
    target.dispatchEvent(ev);
    return ev;
}
function entries(n = 3, extra = {}) {
    const picked = [];
    const list = Array.from({ length: n }, (_, i) => ({ label: `Thing ${i + 1}`, onSelect: () => picked.push(i + 1), ...extra }));
    list.picked = picked;
    return list;
}
function reset() {
    closeInteractionMenu();
    delete window.currentPlayerRoom;
    delete window.roomHasActiveHostile;
    delete window.playerIsKnockedOut;
    alerts.length = 0;
    assert.equal(openModalCount(), 0, 'nothing left on the stack');
}

// 45 first: the subscription is once per page, so nothing may have opened with a dispatcher yet
test('45 room_entered: no subscription at import, one after the first open, still one after a second', () => {
    const handlers = [];
    window.eventDispatcher = { on: (name, fn) => handlers.push({ name, fn }) };
    assert.equal(handlers.length, 0, 'none at import');
    showInteractionMenu(entries(), 10, 10, 'Pick');
    assert.deepEqual(handlers.map(h => h.name), ['room_entered']);
    closeInteractionMenu();
    showInteractionMenu(entries(), 10, 10, 'Pick');
    assert.equal(handlers.length, 1, 'still one');
    handlers[0].fn({});
    assert.equal(isInteractionMenuOpen(), false, 'entering a room closes the menu');
    handlers[0].fn({}); // nothing open: harmless
    delete window.eventDispatcher;
    reset();
});

test('37 the X sits in the title row outside the list; no Cancel; the title is in .be-im-title', () => {
    showInteractionMenu(entries(), 10, 10, 'Which one?');
    const menu = $('#be-interaction-menu');
    const x = menu.querySelector('.be-im-close');
    const list = menu.querySelector('.be-im-list[role="menu"]');
    assert.ok(x && list);
    assert.ok(!list.contains(x), 'the X is outside the scrolling list');
    assert.ok(x.classList.contains('game-modal-close'), 'the shared close X class');
    assert.equal(menu.querySelector('.be-im-title').textContent, 'Which one?');
    assert.equal(menu.querySelector('.be-im-head').contains(x), true);
    assert.ok(!/cancel/i.test(menu.textContent), 'no Cancel entry');
    const css = document.getElementById('be-interaction-menu-style')?.textContent
        ?? [...document.head.querySelectorAll('style')].map(s => s.textContent).join('\n');
    const closeRule = css.match(/#be-interaction-menu \.be-im-close \{[^}]*\}/)[0];
    assert.match(closeRule, /position:\s*static/, 'not absolutely positioned');
    x.click();
    assert.equal(isInteractionMenuOpen(), false);
    reset();
});

test('46 the list scrolls and the title row does not', () => {
    const css = [...document.head.querySelectorAll('style')].map(s => s.textContent).join('\n');
    const rule = (sel) => css.match(new RegExp(sel.replace(/[.#[\]]/g, '\\$&') + ' \\{[^}]*\\}'))[0];
    assert.match(rule('#be-interaction-menu .be-im-list'), /overflow-y:\s*auto/);
    assert.doesNotMatch(rule('#be-interaction-menu'), /overflow/);
    assert.doesNotMatch(rule('#be-interaction-menu .be-im-head'), /overflow/);
    assert.match(rule('#be-interaction-menu'), /flex-direction:\s*column/);
});

test('38 keyboard: 1 to 9, arrows (wrapping), Home, End, Enter, Tab, Esc', () => {
    const e = entries(3);
    showInteractionMenu(e, 10, 10, 'Pick', { numberKeys: true, keyboard: true, holdKeys: true });
    const btns = items();
    assert.equal(document.activeElement, btns[0], 'first entry focused');
    press('ArrowDown');
    assert.equal(document.activeElement, btns[1]);
    press('End');
    assert.equal(document.activeElement, btns[2]);
    press('ArrowDown');
    assert.equal(document.activeElement, btns[0], 'wraps');
    press('ArrowUp');
    assert.equal(document.activeElement, btns[2], 'wraps back');
    press('Home');
    assert.equal(document.activeElement, btns[0]);
    // Tab walks the entries, then the X, then round again
    press('Tab'); press('Tab'); press('Tab');
    assert.equal(document.activeElement, $('.be-im-close'), 'the X comes after the entries');
    press('Tab');
    assert.equal(document.activeElement, btns[0]);
    press('Tab', { shiftKey: true });
    assert.equal(document.activeElement, $('.be-im-close'), 'Shift+Tab goes back to the X');
    press('Escape');
    assert.equal(isInteractionMenuOpen(), false, 'Esc closes it through the stack');
    assert.equal(openModalCount(), 0);

    // Enter picks the focused entry; a number key picks that entry
    showInteractionMenu(e, 10, 10, 'Pick', { numberKeys: true, keyboard: true });
    press('ArrowDown');
    press('Enter');
    assert.deepEqual(e.picked, [2]);
    assert.equal(isInteractionMenuOpen(), false);
    showInteractionMenu(e, 10, 10, 'Pick', { numberKeys: true, keyboard: true });
    press('3');
    assert.deepEqual(e.picked, [2, 3]);
    showInteractionMenu(e, 10, 10, 'Pick', { numberKeys: true, keyboard: true });
    press('9');
    assert.equal(isInteractionMenuOpen(), true, 'no ninth entry: the menu stays');
    reset();
});

test('39 holdKeys: on the stack while open, off it after every close path', () => {
    const open = () => { const e = entries(2); showInteractionMenu(e, 10, 10, 'Pick', { holdKeys: true, numberKeys: true }); return e; };
    open();
    assert.equal(openModalCount(), 1);
    $('.be-im-close').click();
    assert.equal(openModalCount(), 0, 'X');
    open(); press('Escape');
    assert.equal(openModalCount(), 0, 'Esc');
    assert.equal(isInteractionMenuOpen(), false);
    open();
    $('#be-interaction-menu-overlay').dispatchEvent(new window.Event('pointerdown', { bubbles: true, cancelable: true }));
    assert.equal(openModalCount(), 0, 'backdrop');
    open(); items()[0].click();
    assert.equal(openModalCount(), 0, 'pick');
    open(); press('2');
    assert.equal(openModalCount(), 0, 'number key');
    open(); window.closeInteractionMenu();
    assert.equal(openModalCount(), 0, 'a minigame starting calls window.closeInteractionMenu');
    open(); window.currentPlayerRoom = 'a';
    closeInteractionMenu(); window.currentPlayerRoom = 'a'; open();
    window.currentPlayerRoom = 'b'; tickInteractionMenu(Date.now(), { force: true });
    assert.equal(openModalCount(), 0, 'room change');
    delete window.currentPlayerRoom;
    open(); window.roomHasActiveHostile = () => true; tickInteractionMenu(Date.now(), { force: true });
    assert.equal(openModalCount(), 0, 'fight start');
    delete window.roomHasActiveHostile;
    open(); window.playerIsKnockedOut = () => true; tickInteractionMenu(Date.now(), { force: true });
    assert.equal(openModalCount(), 0, 'knocked out');
    delete window.playerIsKnockedOut;
    const gone = entries(2, { check: () => 'Gone.' });
    showInteractionMenu(gone, 10, 10, 'Pick', { holdKeys: true });
    tickInteractionMenu(Date.now(), { force: true });
    assert.equal(isInteractionMenuOpen(), false);
    assert.equal(openModalCount(), 0, 'tick with nothing usable left');
    reset();
});

test('39 a menu opened in a fight stays open through the tick; one opened outside closes', () => {
    window.roomHasActiveHostile = () => true;
    showInteractionMenu(entries(2), 10, 10, 'Pick');
    tickInteractionMenu(Date.now(), { force: true });
    assert.equal(isInteractionMenuOpen(), true);
    reset();
});

test('40 a confirm opening closes the menu, and Esc then declines the confirm', () => {
    showInteractionMenu(entries(), 10, 10, 'Pick', { holdKeys: true, numberKeys: true });
    let declined = 0;
    const un = registerModal(() => { declined++; un(); });
    assert.equal(isInteractionMenuOpen(), false, 'the menu yielded');
    assert.equal(openModalCount(), 1, 'only the confirm is on the stack');
    press('Escape');
    assert.equal(declined, 1);
    assert.equal(openModalCount(), 0);
    reset();
});

test('40 a menu without holdKeys is not closed by a later overlay', () => {
    showInteractionMenu(entries(), 10, 10, 'Pick', { numberKeys: true });
    const un = registerModal(() => un());
    assert.equal(isInteractionMenuOpen(), true);
    un();
    reset();
});

test('41 touch: nothing focused, no key hints, placed at the finger', () => {
    showInteractionMenu(entries(), 300, 400, 'Pick', { touch: true, numberKeys: true, keyboard: true });
    assert.notEqual(document.activeElement, items()[0]);
    assert.equal(document.querySelectorAll('.be-im-key').length, 0);
    assert.ok($('#be-interaction-menu-overlay').classList.contains('be-im-touch'));
    const m = $('#be-interaction-menu');
    assert.equal(m.style.left, '300px');
    assert.equal(m.style.top, '384px');
    reset();
    // the same menu by keyboard does show the hints and takes the focus
    showInteractionMenu(entries(), 300, 400, 'Pick', { numberKeys: true });
    assert.equal(document.querySelectorAll('.be-im-key').length, 3);
    assert.equal(document.activeElement, items()[0]);
    reset();
});

test('42 no options: not on the stack, the module\'s own Esc closes it, no focus, no hints', () => {
    showInteractionMenu(entries(), 10, 10, 'Pick');
    assert.equal(openModalCount(), 0);
    assert.notEqual(document.activeElement, items()[0]);
    assert.equal(document.querySelectorAll('.be-im-key').length, 0);
    press('ArrowDown');
    assert.notEqual(document.activeElement, items()[1], 'arrows are not the menu\'s without keyboard');
    press('Escape');
    assert.equal(isInteractionMenuOpen(), false);
    reset();
});

test('43 icon geometry: 16 x 16 centred, 35 x 46 middle columns and top rows at even offsets', () => {
    assert.deepEqual(icons.spriteIconGeometry(16, 16), { width: 32, height: 32, position: '16px 16px' });
    assert.deepEqual(icons.spriteIconGeometry(35, 46), { width: 70, height: 92, position: '-2px 0px' });
    const g = icons.spriteIconGeometry(35, 46);
    assert.ok(parseInt(g.position, 10) % 2 === 0, 'even offset, so every source pixel is 2 px wide');
    // drawn into a menu row
    showInteractionMenu([{ label: 'Thing', icon: { src: 'a.png', ...g }, onSelect() {} }], 10, 10, 'Pick');
    const box = $('.be-im-icon');
    assert.equal(box.style.backgroundSize, '70px 92px');
    assert.equal(box.style.backgroundPosition, '-2px 0px');
    reset();
});

test('43 sprite icons: copy per frame; frameTotal 1 and 2 use the file, 3 gets the open hand', () => {
    const sprite = (key, frameTotal, extra = {}) => ({
        texture: { key, frameTotal },
        frame: { name: '0', cutWidth: 16, cutHeight: 16 },
        scene: { textures: { getBase64: () => null } }, ...extra
    });
    icons.resetMenuIconCache();
    for (const total of [1, 2]) {
        const icon = icons.spriteMenuIcon(sprite(`t${total}`, total));
        assert.match(icon.src, /\/assets\/objects\/t\d\.png$/, `frameTotal ${total}: the file`);
        assert.equal(icon.position, '16px 16px');
    }
    const hand = icons.spriteMenuIcon(sprite('t3', 3));
    assert.match(hand.src, /hand_frames\.png$/, 'frameTotal 3 with no copy: open hand');
    // a copy that works is used whatever the frame count
    const copied = icons.spriteMenuIcon(sprite('t4', 3, { scene: { textures: { getBase64: () => 'data:image/png;base64,AAAA' } } }));
    assert.equal(copied.src, 'data:image/png;base64,AAAA');
    assert.equal(icons.spriteMenuIcon(null).frame, 0, 'no sprite: open hand');
    // the second ask for the same key and frame is served from the cache
    assert.equal(icons.spriteMenuIcon(sprite('t4', 3)), copied);
});

test('43 NPC icons: a headshot at 64 x 64; none gives the silhouette, unhidden, at 64 x 64', async () => {
    const sprite = { npcId: 'sarah', texture: { key: 'sarah' } };
    const manager = { getNPC: () => ({ spriteSheet: 'sarah' }) };
    const imageCtor = (ok) => class {
        set src(v) { this._src = v; queueMicrotask(() => { if (ok) { this.naturalWidth = 32; this.naturalHeight = 32; this.onload?.(); } else this.onerror?.(); }); }
        get src() { return this._src; }
    };
    const tick = () => new Promise(r => setTimeout(r, 0));
    showInteractionMenu([{ label: 'Sarah', kind: 'npc', icon: icons.npcMenuIcon(sprite, { npcManager: manager, ImageCtor: imageCtor(true), onMissing() {} }), onSelect() {} }], 10, 10, 'Pick');
    await tick();
    let box = $('.be-im-icon');
    assert.equal(box.style.backgroundSize, '64px 64px');
    assert.equal(box.dataset.frame, 'headshot');
    reset();
    showInteractionMenu([{ label: 'Sarah', kind: 'npc', icon: icons.npcMenuIcon(sprite, { npcManager: manager, ImageCtor: imageCtor(false), onMissing() {} }), onSelect() {} }], 10, 10, 'Pick');
    await tick();
    box = $('.be-im-icon');
    assert.equal(box.hidden, false);
    assert.equal(box.dataset.frame, 'silhouette');
    assert.equal(box.style.backgroundSize, '64px 64px');
    assert.match(box.style.backgroundImage, /pc-user-silhouette\.png/);
    reset();
});

test('44 a Gone. or Out of reach. entry cannot be chosen', () => {
    let state = null;
    const e = entries(2);
    e[0].check = () => state;
    showInteractionMenu(e, 10, 10, 'Pick', { numberKeys: true, keyboard: true });
    state = 'Gone.';
    tickInteractionMenu(Date.now(), { force: true });
    const first = items()[0];
    assert.ok(first.classList.contains('be-im-disabled'));
    assert.equal(first.querySelector('.be-im-detail').textContent, 'Gone.');
    first.click();
    press('1');
    assert.deepEqual(e.picked, [], 'nothing ran');
    assert.equal(isInteractionMenuOpen(), true, 'the menu stays');
    assert.notEqual(document.activeElement, first, 'focus left the greyed entry');
    state = 'Out of reach.';
    tickInteractionMenu(Date.now(), { force: true });
    assert.equal(first.querySelector('.be-im-detail').textContent, 'Out of reach.');
    state = null;
    tickInteractionMenu(Date.now(), { force: true });
    assert.equal(first.classList.contains('be-im-disabled'), false, 'back in reach: usable again');
    reset();
});

test('44 an entry that goes between ticks is re-checked when chosen', () => {
    let state = null;
    const e = entries(2);
    e[0].check = () => state;
    showInteractionMenu(e, 10, 10, 'Pick');
    state = 'Out of reach.';
    items()[0].click();
    assert.deepEqual(e.picked, []);
    assert.equal(alerts.at(-1)[0], "Can't reach it from here.");
    showInteractionMenu(e, 10, 10, 'Pick');
    state = 'Gone.';
    items()[0].click();
    assert.equal(alerts.at(-1)[0], "That's no longer there.");
    reset();
});

test('the More below cue starts hidden and is not read out', () => {
    showInteractionMenu(entries(), 10, 10, 'Pick');
    const more = $('.be-im-more');
    assert.equal(more.textContent, 'More below');
    assert.equal(more.hidden, true, 'a short list shows no cue');
    assert.equal(more.getAttribute('aria-hidden'), 'true');
    reset();
});

test('47 an entry with a kind and an entity id shows its label as text; the id is data only (m01 break room chairs: "Sit: chair")', () => {
    const list = [
        { label: 'Sit: chair', kind: 'object', entityId: 'break_room_chair_1', onSelect: () => {} },
        { label: 'Coffee machine', kind: 'object', entityId: 'break_room_coffee', onSelect: () => {} }
    ];
    showInteractionMenu(list, 10, 10, 'Which one?');
    const rows = items();
    assert.deepEqual(rows.map(b => b.querySelector('.be-im-label').textContent), ['Sit: chair', 'Coffee machine']);
    assert.equal(rows[0].dataset.entityId, 'break_room_chair_1');
    assert.ok(!rows[0].textContent.includes('break_room_chair_1'), 'the raw id is never on screen');
    reset();
});

test('47 game.js builds a seat\'s menu label as "Sit: <name>", the same as main', () => {
    const src = readFileSync(join(js, 'core/game.js'), 'utf8');
    assert.ok(src.includes('label: seat ? `Sit: ${name}` : name,'));
});

// ── Phone placement (overlap plan 6.3): the menu goes beside the tapped things, not over them ──
test('menuPlacement: beside the tapped box on the side with more room, level with it; above or below when neither side fits', () => {
    const view = { width: 390, height: 844 };
    const menu = { width: 200, height: 300 };
    const overlap = (m, at, box) => at.x < box.right && at.x + m.width > box.left && at.y < box.bottom && at.y + m.height > box.top;
    // Things on the left of a 390 px screen: the menu goes right of them
    const left = { left: 20, top: 400, right: 120, bottom: 460 };
    const r = menuPlacement(menu, view, left);
    assert.ok(r.x >= left.right, `right of the box: ${JSON.stringify(r)}`);
    assert.ok(!overlap(menu, r, left));
    assert.ok(r.x + menu.width <= view.width - 8 && r.y >= 8 && r.y + menu.height <= view.height - 8, 'on screen');
    // Things on the right: the menu goes left of them
    const right = { left: 280, top: 400, right: 370, bottom: 460 };
    const l = menuPlacement(menu, view, right);
    assert.ok(l.x + menu.width <= right.left && !overlap(menu, l, right), JSON.stringify(l));
    // Wide things in the middle: no side has 200 px, so above or below, whichever has more room
    const mid = { left: 40, top: 120, right: 350, bottom: 220 };
    const b = menuPlacement(menu, view, mid);
    assert.ok(b.y >= mid.bottom && !overlap(menu, b, mid), JSON.stringify(b));
    const low = { left: 40, top: 560, right: 350, bottom: 700 };
    const a = menuPlacement(menu, view, low);
    assert.ok(a.y + menu.height <= low.top && !overlap(menu, a, low), JSON.stringify(a));
    // Nowhere clear: null, the caller keeps its usual spot
    assert.equal(menuPlacement({ width: 380, height: 800 }, view, { left: 100, top: 300, right: 200, bottom: 400 }), null);
});

test('showInteractionMenu: on touch the menu with an avoid box sits clear of it; on desktop the box is ignored', () => {
    Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 844, configurable: true });
    const rectOf = () => ({ width: 200, height: 300, left: 0, top: 0, right: 200, bottom: 300 });
    const proto = window.HTMLElement.prototype;
    const orig = proto.getBoundingClientRect;
    proto.getBoundingClientRect = rectOf;
    try {
        const box = { left: 20, top: 400, right: 120, bottom: 460 };
        showInteractionMenu(entries(), 70, 430, 'Pick', { touch: true, avoid: box });
        const m = $('#be-interaction-menu');
        assert.ok(parseInt(m.style.left, 10) >= box.right, `touch: right of the box, left ${m.style.left}`);
        closeInteractionMenu();
        showInteractionMenu(entries(), 70, 430, 'Pick', { avoid: box });
        const d = $('#be-interaction-menu');
        assert.ok(parseInt(d.style.left, 10) < box.right, `desktop: the usual spot over the tap, left ${d.style.left}`);
    } finally {
        proto.getBoundingClientRect = orig;
        reset();
    }
});
