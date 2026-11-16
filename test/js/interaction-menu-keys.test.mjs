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
    // Nowhere clear: the least-cover spot, and it says so
    const tight = menuPlacement({ width: 380, height: 800 }, view, { left: 100, top: 300, right: 200, bottom: 400 });
    assert.equal(tight.covered, true);
    assert.ok(tight.x >= 0 && tight.y >= 0 && tight.x + 380 <= 390 && tight.y + 800 <= 844, 'on screen');
});

const ovl = (m, at, box) => Math.max(0, Math.min(at.x + m.width, box.right) - Math.max(at.x, box.left))
    * Math.max(0, Math.min(at.y + m.height, box.bottom) - Math.max(at.y, box.top));

test('menuPlacement: the live 6074 numbers (312x327 menu, PC [170,398,26,22] and cup) leave 0 px under the menu and 8 px clear', () => {
    const view = { width: 390, height: 844 };
    const menu = { width: 312, height: 327 };
    // The PC and a cup above and left of it: the union is what is avoided
    const pc = { left: 170, top: 398, right: 196, bottom: 420 };
    const cup = { left: 120, top: 380, right: 136, bottom: 396 };
    const union = { left: Math.min(pc.left, cup.left), top: Math.min(pc.top, cup.top), right: Math.max(pc.right, cup.right), bottom: Math.max(pc.bottom, cup.bottom) };
    for (const margin of [8, 16]) {
        const r = menuPlacement(menu, view, union, margin);
        assert.equal(r.covered, false, JSON.stringify(r));
        assert.equal(ovl(menu, r, pc), 0);
        assert.equal(ovl(menu, r, cup), 0);
        // at least `margin` px between the menu and the union on the side it chose
        const gapX = Math.max(union.left - (r.x + menu.width), r.x - union.right);
        const gapY = Math.max(union.top - (r.y + menu.height), r.y - union.bottom);
        assert.ok(Math.max(gapX, gapY) >= margin, `clearance ${Math.max(gapX, gapY)} < ${margin}`);
        assert.ok(r.x >= 0 && r.x + menu.width <= 390 && r.y >= 0 && r.y + menu.height <= 844, 'on screen');
    }
    // The old behaviour put it at y 76 (bottom 403) over the PC: that spot is covered
    assert.ok(ovl(menu, { x: 32, y: 76 }, pc) > 0);
});

test('menuPlacement: a union taller than half the screen goes beside it, or when too wide falls back to least cover', () => {
    const view = { width: 390, height: 844 };
    // Tall and narrow on the left: beside, on the right, level with the middle
    const tall = { left: 10, top: 100, right: 60, bottom: 600 };
    const menu = { width: 200, height: 300 };
    const r = menuPlacement(menu, view, tall);
    assert.equal(r.covered, false);
    assert.ok(r.x >= tall.right + 8);
    // Tall and wide: nowhere clear; least cover, reported, still on screen
    const big = { left: 10, top: 100, right: 380, bottom: 700 };
    const f = menuPlacement(menu, view, big);
    assert.equal(f.covered, true);
    assert.equal(f.cover, ovl(menu, f, big));
    assert.ok(f.x >= 0 && f.x + menu.width <= 390 && f.y >= 0 && f.y + menu.height <= 844);
    // Nothing else on screen covers less
    for (let x = 8; x <= 182; x += 6) for (let y = 8; y <= 536; y += 6) assert.ok(ovl(menu, { x, y }, big) >= f.cover, `(${x},${y}) covers less`);
});

test('menuPlacement: screen edges - a box on the edge, a menu as big as the screen, a box off-centre keep the menu on screen', () => {
    const view = { width: 390, height: 844 };
    const menu = { width: 200, height: 300 };
    for (const box of [
        { left: 0, top: 0, right: 30, bottom: 30 }, { left: 360, top: 0, right: 390, bottom: 30 },
        { left: 0, top: 814, right: 30, bottom: 844 }, { left: 360, top: 814, right: 390, bottom: 844 },
        { left: 150, top: 0, right: 240, bottom: 40 }, { left: 150, top: 800, right: 240, bottom: 844 }
    ]) {
        const r = menuPlacement(menu, view, box);
        assert.equal(r.covered, false, JSON.stringify([box, r]));
        assert.equal(ovl(menu, r, box), 0);
        assert.ok(r.x >= 8 && r.x + menu.width <= 390 - 8 && r.y >= 8 && r.y + menu.height <= 844 - 8, `edge ${JSON.stringify([box, r])}`);
    }
    // A menu larger than the screen is centred, not pushed off a side
    const huge = menuPlacement({ width: 500, height: 900 }, view, { left: 100, top: 100, right: 150, bottom: 150 });
    assert.equal(huge.covered, true);
    assert.ok(huge.x <= 0 && huge.y <= 0);
    // The clearance grows with the margin (the HUD zoom)
    const m = menuPlacement(menu, view, { left: 20, top: 400, right: 120, bottom: 460 }, 24);
    assert.ok(m.x >= 120 + 24);
});

test('showInteractionMenu: on touch the menu with an avoid box sits clear of it; on desktop a spot that would crowd the box is moved clear', () => {
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
        // the usual spot (bottom 414) covers the box, so desktop takes the clear spot too
        const dl = parseFloat(d.style.left), dt = parseFloat(d.style.top);
        assert.equal(ovl({ width: 200, height: 300 }, { x: dl, y: dt }, box), 0, `desktop menu at ${dl},${dt} covers the box`);
        closeInteractionMenu();
        // with room (the box far from the usual spot) the menu stays near the cursor
        showInteractionMenu(entries(), 70, 430, 'Pick', { avoid: { left: 250, top: 700, right: 300, bottom: 760 } });
        const near = $('#be-interaction-menu');
        assert.equal(parseFloat(near.style.top), 114, `desktop with room keeps the cursor spot, top ${near.style.top}`);
    } finally {
        proto.getBoundingClientRect = orig;
        reset();
    }
});

test('menuPlacement: a fallback spot that overlaps nothing but is closer than the margin is tight, not clear', () => {
    // The review's case: 360 px wide, zoom 1, a 326x365 menu, a tall union; y 427.7 leaves a 3.7 px gap
    const view = { width: 360, height: 800.7 };
    const menu = { width: 326, height: 365 };
    const avoid = { left: 183, top: 132, right: 250, bottom: 424 };
    const r = menuPlacement(menu, view, avoid, 8);
    assert.equal(r.cover, 0, JSON.stringify(r));
    assert.equal(r.covered, false);
    assert.ok(r.gap < 8, `gap ${r.gap}`);
    assert.ok(Math.abs(r.gap - 3.7) < 0.5, `gap ${r.gap}`);
    assert.equal(r.tight, true, 'not reported clear');
    // A genuinely clear spot has a gap of at least the margin and is not tight
    const clear = menuPlacement({ width: 200, height: 300 }, { width: 390, height: 844 }, { left: 20, top: 400, right: 120, bottom: 460 }, 8);
    assert.equal(clear.tight, false);
    assert.ok(clear.gap >= 8, `gap ${clear.gap}`);
    // A fractional margin is rounded up
    const m = menuPlacement({ width: 100, height: 100 }, { width: 390, height: 844 }, { left: 20, top: 400, right: 120, bottom: 460 }, 8.2);
    assert.ok(m.gap >= 9, `gap ${m.gap}`);
});


test('menuPlacement: fractional rects round away from the box, so the rendered gap is at least the margin', () => {
    const view = { width: 390, height: 844 };
    const menu = { width: 312, height: 327 };
    // Below: avoid.bottom + 8 = 436.49 must become 437, not round to 436 (7.51 px)
    const high = { left: 120.2, top: 20.3, right: 196.7, bottom: 428.49 };
    const below = menuPlacement({ width: 312, height: 300 }, view, high, 8);
    assert.equal(below.covered, false);
    assert.equal(below.tight, false);
    assert.ok(Number.isInteger(below.y) && below.y - high.bottom >= 8, `gap ${below.y - high.bottom}`);
    // Above: avoid.top - 8 - height must floor
    const low = { left: 120.2, top: 500.6, right: 196.7, bottom: 560.2 };
    const above = menuPlacement({ width: 312, height: 327.4 }, view, low, 8);
    assert.ok(Number.isInteger(above.y) && low.top - (above.y + 327.4) >= 8, `gap ${low.top - (above.y + 327.4)}`);
    // Beside: both directions
    const narrow = { left: 20.4, top: 400, right: 40.3, bottom: 420 };
    const right = menuPlacement({ width: 300, height: 200 }, view, narrow, 8);
    assert.ok(right.x - narrow.right >= 8, `gap ${right.x - narrow.right}`);
    const farRight = { left: 340.6, top: 400, right: 360.2, bottom: 420 };
    const left = menuPlacement({ width: 300.3, height: 200 }, view, farRight, 8);
    assert.ok(farRight.left - (left.x + 300.3) >= 8, `gap ${farRight.left - (left.x + 300.3)}`);
    // The phone path writes those numbers unrounded
    Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 844, configurable: true });
    const proto = window.HTMLElement.prototype;
    const orig = proto.getBoundingClientRect;
    proto.getBoundingClientRect = () => ({ width: 312, height: 300, left: 0, top: 0, right: 312, bottom: 300 });
    try {
        showInteractionMenu(entries(), 150, 430, 'Pick', { touch: true, avoid: high });
        const m = $('#be-interaction-menu');
        assert.ok(parseFloat(m.style.top) - high.bottom >= 8, `rendered gap ${parseFloat(m.style.top) - high.bottom}`);
        assert.equal(m.dataset.placement, 'clear');
    } finally {
        proto.getBoundingClientRect = orig;
        reset();
    }
});

test('showInteractionMenu: a mouse click in a narrow window puts the menu clear of the tapped PC and cup', () => {
    Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 844, configurable: true });
    const proto = window.HTMLElement.prototype;
    const orig = proto.getBoundingClientRect;
    proto.getBoundingClientRect = () => ({ width: 312, height: 327, left: 0, top: 0, right: 312, bottom: 327 });
    try {
        const pc = { left: 170, top: 398, right: 196, bottom: 420 };
        const cup = { left: 120, top: 380, right: 136, bottom: 396 };
        const union = { left: 120, top: 380, right: 196, bottom: 420 };
        // The old desktop spot: bottom at tap y - 16, here 398 + 4.8 over the PC
        showInteractionMenu(entries(), 190, 414.2, 'Pick', { avoid: union });
        const m = $('#be-interaction-menu');
        const at = { x: parseFloat(m.style.left), y: parseFloat(m.style.top) };
        const size = { width: 312, height: 327 };
        assert.equal(ovl(size, at, pc), 0, `covers the PC at ${at.x},${at.y}`);
        assert.equal(ovl(size, at, cup), 0, `covers the cup at ${at.x},${at.y}`);
        assert.equal(m.dataset.placement, 'clear');
        const gap = Math.max(union.top - (at.y + 327), at.y - union.bottom, union.left - (at.x + 312), at.x - union.right);
        assert.ok(gap >= 8, `gap ${gap}`);
    } finally {
        proto.getBoundingClientRect = orig;
        reset();
    }
});
