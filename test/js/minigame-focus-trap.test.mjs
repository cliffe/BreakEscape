// Tab and Shift+Tab stay inside the open minigame (framework/minigame-manager.js focus trap).
// The real manager and base class run against jsdom.
// Run with: node --max-old-space-size=2048 test/js/minigame-focus-trap.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);
const { MinigameScene } = await imp('minigames/framework/base-minigame.js');
const { MinigameFramework: MF } = await imp('minigames/framework/minigame-manager.js');

class Demo extends MinigameScene {
    init() {
        super.init();
        this.gameContainer.innerHTML = '<input id="a"><button id="b">B</button><button id="dis" disabled>D</button>'
            + '<button id="neg" tabindex="-1">N</button><div style="display:none"><button id="hid">H</button></div>'
            + '<textarea id="t"></textarea>';
    }
}
MF.registerScene('demo', Demo);
MF.registerScene('demo2', Demo);

const hud = document.createElement('button');
hud.id = 'objectives-toggle';
document.body.appendChild(hud);
const outside = document.createElement('button');
outside.id = 'notepad';
document.body.appendChild(outside);

function tab(shift = false, target = document.activeElement || document.body) {
    const ev = new dom.window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true });
    (target || document.body).dispatchEvent(ev);
    return ev;
}
const active = () => document.activeElement?.id;
const close = () => { MF.forceCloseMinigame(); MF.currentMinigame = null; };

test('Tab cycles forwards through the container only, skipping disabled, hidden and tabindex -1', () => {
    hud.focus();
    MF.startMinigame('demo', null, {});
    const close_ = document.getElementById('minigame-close');
    close_.focus();
    const seen = [];
    for (let i = 0; i < 6; i++) { const ev = tab(); assert.equal(ev.defaultPrevented, true); seen.push(active()); }
    assert.deepEqual(seen, ['a', 'b', 't', 'minigame-close', 'a', 'b']);
    close();
});

test('Shift+Tab wraps from the first element to the last', () => {
    MF.startMinigame('demo', null, {});
    const first = MF.currentMinigame.container.querySelector(MF.FOCUSABLE_SELECTOR);
    first.focus();
    tab(true);
    assert.ok(document.activeElement === MF.currentMinigame.container.querySelectorAll('#a, #b, #t, #minigame-close')[3]);
    close();
});

test('focus that has escaped to the HUD is pulled back in', () => {
    MF.startMinigame('demo', null, {});
    hud.focus();
    tab();
    assert.ok(MF.currentMinigame.container.contains(document.activeElement));
    hud.focus();
    tab(true);
    assert.ok(MF.currentMinigame.container.contains(document.activeElement));
    close();
});

test('focusables are recomputed on every Tab', () => {
    MF.startMinigame('demo', null, {});
    document.getElementById('b').focus();
    const extra = document.createElement('button');
    extra.id = 'extra';
    document.getElementById('b').after(extra);
    tab();
    assert.equal(active(), 'extra');
    extra.disabled = true;
    document.getElementById('b').focus();
    tab();
    assert.equal(active(), 't');
    close();
});

test('Tab leaves a text box and does not stop other keys', () => {
    MF.startMinigame('demo', null, {});
    document.getElementById('a').focus();
    tab();
    assert.equal(active(), 'b');
    const ev = new dom.window.KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
    document.getElementById('b').dispatchEvent(ev);
    assert.equal(ev.defaultPrevented, false);
    close();
});

test('with no minigame open Tab is left alone', () => {
    hud.focus();
    const ev = tab();
    assert.equal(ev.defaultPrevented, false);
    assert.equal(MF._trapHandler, null);
});

test('a higher modal (game-confirm overlay, aria-modal outside the minigame) keeps Tab', () => {
    MF.startMinigame('demo', null, {});
    const overlay = document.createElement('div');
    overlay.className = 'game-confirm-overlay';
    document.body.appendChild(overlay);
    let ev = tab();
    assert.equal(ev.defaultPrevented, false);
    overlay.remove();
    const m = document.createElement('div');
    m.setAttribute('aria-modal', 'true');
    document.body.appendChild(m);
    ev = tab();
    assert.equal(ev.defaultPrevented, false);
    m.remove();
    window.gameConfirmOpen = () => true;
    ev = tab();
    assert.equal(ev.defaultPrevented, false);
    delete window.gameConfirmOpen;
    ev = tab();
    assert.equal(ev.defaultPrevented, true);
    close();
});

test('an inner [data-own-tab-cycle] panel or listbox keeps its own Tab; an inner role=dialog becomes the trap root', () => {
    MF.startMinigame('demo', null, {});
    const host = MF.currentMinigame.gameContainer;
    host.insertAdjacentHTML('beforeend', '<div aria-modal="true" data-own-tab-cycle><button id="in-modal">M</button></div>'
        + '<ul role="listbox"><li tabindex="0" id="opt">o</li></ul><div role="dialog"><button id="in-dialog">D</button></div>');
    document.getElementById('in-modal').focus();
    assert.equal(tab().defaultPrevented, false);
    document.getElementById('opt').focus();
    assert.equal(tab().defaultPrevented, false);
    document.getElementById('in-dialog').focus();
    assert.equal(tab().defaultPrevented, true);
    assert.equal(active(), 'in-dialog', 'only one tabbable in the dialog: Tab stays on it');
    // focus elsewhere in the minigame is pulled into the dialog, not onto its siblings
    document.getElementById('a').focus();
    tab();
    assert.equal(active(), 'in-dialog');
    close();
});

test('an embedded container or params.focusTrap false is not trapped', () => {
    const ext = document.createElement('div');
    ext.setAttribute('data-external', '');
    document.body.appendChild(ext);
    MF.startMinigame('demo', ext, {});
    assert.equal(tab().defaultPrevented, false);
    close();
    ext.remove();
    MF.startMinigame('demo', null, { focusTrap: false });
    assert.equal(tab().defaultPrevented, false);
    close();
});

test('a child minigame traps to the child, and the parent comes back trapped', () => {
    MF.startMinigame('demo', null, { suspended: true });
    const parent = MF.currentMinigame;
    MF.startMinigame('demo2', null, { returnTo: { sceneType: 'demo', params: {} } });
    const child = MF.currentMinigame;
    assert.notEqual(child, parent);
    document.getElementById('b').focus();
    tab();
    assert.ok(child.container.contains(document.activeElement));
    MF.endMinigame(true, {});
    assert.equal(MF.currentMinigame._sceneType, 'demo');
    hud.focus();
    tab();
    assert.ok(MF.currentMinigame.container.contains(document.activeElement));
    close();
});

test('focus goes back to the opener when the minigame closes, and the trap is removed', () => {
    hud.focus();
    MF.startMinigame('demo', null, {});
    assert.ok(MF._trapHandler);
    MF.endMinigame(false, null);
    assert.ok(document.activeElement === hud);
    assert.equal(MF._trapHandler, null);
});

test('opener survives a chain (displacing start, returnTo reopen) and is not forced over other focus', () => {
    hud.focus();
    MF.startMinigame('demo', null, { suspended: true });
    MF.startMinigame('demo2', null, { returnTo: { sceneType: 'demo', params: {} } });
    MF.endMinigame(true, {});
    MF.endMinigame(true, {});
    assert.ok(document.activeElement === hud);
    // something else took focus during close: leave it
    hud.focus();
    MF.startMinigame('demo', null, { onComplete: () => outside.focus() });
    MF.endMinigame(false, null);
    assert.ok(document.activeElement === outside);
});

const GAME_MENU = '<div class="game-menu-overlay" style="display:none"><div class="game-menu-panel" role="dialog" aria-modal="true"><button id="gm-btn">Menu</button></div></div>';

test('B1: a hidden aria-modal (the permanent game menu, restart confirm) does not stop the trap', () => {
    document.body.insertAdjacentHTML('beforeend', GAME_MENU);
    document.body.insertAdjacentHTML('beforeend', '<div id="restart" aria-modal="true" style="display:none"></div>');
    MF.startMinigame('demo', null, {});
    document.getElementById('minigame-close').focus();
    const seen = [];
    for (let i = 0; i < 4; i++) { const ev = tab(); assert.equal(ev.defaultPrevented, true); seen.push(active()); }
    assert.deepEqual(seen, ['a', 'b', 't', 'minigame-close']);
    // a visible one makes it step aside
    document.querySelector('.game-menu-overlay').style.display = 'block';
    assert.equal(tab().defaultPrevented, false);
    document.querySelector('.game-menu-overlay').style.display = 'none';
    assert.equal(tab().defaultPrevented, true);
    close();
    document.querySelector('.game-menu-overlay').remove();
    document.getElementById('restart').remove();
});

test('B1: window.openModalCount above zero steps aside', () => {
    MF.startMinigame('demo', null, {});
    window.openModalCount = () => 1;
    assert.equal(tab().defaultPrevented, false);
    delete window.openModalCount;
    assert.equal(tab().defaultPrevented, true);
    close();
});

test('M2: [data-focus-trap-include] elements join the cycle after the minigame', () => {
    document.body.insertAdjacentHTML('beforeend', '<div id="ring" data-focus-trap-include><button id="answer">A</button><button id="decline">D</button></div>');
    MF.startMinigame('demo', null, {});
    document.getElementById('t').focus();
    const seen = [];
    for (let i = 0; i < 4; i++) { tab(); seen.push(active()); }
    assert.deepEqual(seen, ['answer', 'decline', 'minigame-close', 'a']);
    document.getElementById('answer').focus();
    tab(true);
    assert.equal(active(), 't');
    document.getElementById('answer').focus();
    assert.equal(tab().defaultPrevented, true, 'focus inside the banner is not an escape');
    assert.equal(active(), 'decline');
    document.getElementById('ring').style.display = 'none';
    document.getElementById('t').focus();
    tab();
    assert.equal(active(), 'minigame-close');
    close();
    document.getElementById('ring').remove();
});

test('M3: iframes and media with controls are reachable', () => {
    MF.startMinigame('demo', null, {});
    MF.currentMinigame.gameContainer.insertAdjacentHTML('beforeend', '<iframe id="vm" title="vm"></iframe><video id="vid" controls></video><video id="novid"></video>');
    // jsdom cannot focus an iframe or media element, so read the cycle list directly
    const ids = MF._trapFocusables(MF.currentMinigame.container).map((el) => el.id);
    assert.deepEqual(ids, ['minigame-close', 'a', 'b', 't', 'vm', 'vid']);
    close();
});

test('m1: one radio per name group, the checked one', () => {
    MF.startMinigame('demo', null, {});
    MF.currentMinigame.gameContainer.insertAdjacentHTML('beforeend',
        '<input type="radio" name="g" id="r1"><input type="radio" name="g" id="r2" checked><input type="radio" name="g" id="r3">');
    document.getElementById('t').focus();
    tab();
    assert.equal(active(), 'r2');
    tab();
    assert.equal(active(), 'minigame-close');
    document.getElementById('r2').checked = false;
    document.getElementById('t').focus();
    tab();
    assert.equal(active(), 'r1');
    close();
});

test('m2: a visible inner own-cycle aria-modal is the trap root when focus is outside it; inside, its own cycle runs', () => {
    MF.startMinigame('demo', null, {});
    MF.currentMinigame.gameContainer.insertAdjacentHTML('beforeend', '<div aria-modal="true" data-own-tab-cycle id="deb"><button id="d1">1</button><button id="d2">2</button></div>');
    document.body.focus();
    document.getElementById('minigame-close').focus();
    assert.equal(tab().defaultPrevented, true);
    assert.equal(active(), 'd1');
    document.getElementById('d1').focus();
    assert.equal(tab().defaultPrevented, false, 'inside the modal its own Tab cycle runs');
    close();
});

test('R2 M1: an inner aria-modal with no Tab cycle of its own is cycled by the trap', () => {
    MF.startMinigame('demo', null, {});
    MF.currentMinigame.gameContainer.insertAdjacentHTML('beforeend',
        '<div aria-modal="true" role="dialog" id="sheet"><button id="s1">1</button><button id="s2">2</button><button id="s3">3</button></div>');
    document.getElementById('s1').focus();
    const seen = [];
    for (let i = 0; i < 4; i++) { const ev = tab(); assert.equal(ev.defaultPrevented, true); seen.push(active()); }
    assert.deepEqual(seen, ['s2', 's3', 's1', 's2'], 'Tab never leaves the sheet');
    tab(true);
    assert.equal(active(), 's1');
    tab(true);
    assert.equal(active(), 's3', 'Shift+Tab wraps too');
    // focus that escaped to the scene or the HUD is pulled into the sheet
    hud.focus();
    tab();
    assert.equal(active(), 's1');
    close();
});

class RootDialog extends MinigameScene {
    init() {
        super.init();
        this.root = document.createElement('div');
        this.root.setAttribute('role', 'dialog');
        this.root.innerHTML = '<button id="rd1">1</button><button id="rd2">2</button>';
        this.gameContainer.appendChild(this.root);
    }
}
MF.registerScene('rootdialog', RootDialog);

test('R2 m1: a role=dialog that is the whole scene is the root, so the ring banner stays reachable', () => {
    document.body.insertAdjacentHTML('beforeend', '<div id="ring" data-focus-trap-include><button id="answer">A</button></div>');
    MF.startMinigame('rootdialog', null, {});
    assert.equal(MF._innerDialog(MF.currentMinigame.container), null, 'the scene root is not an inner dialog');
    document.getElementById('rd2').focus();
    const seen = [];
    for (let i = 0; i < 3; i++) { tab(); seen.push(active()); }
    assert.deepEqual(seen.slice(0, 1), ['answer'], 'the banner is in the cycle');
    assert.ok(seen.includes('rd1') || seen.includes('minigame-close'));
    close();
    document.getElementById('ring').remove();
    // a dialog nested inside the scene root is still an inner dialog
    MF.startMinigame('rootdialog', null, {});
    MF.currentMinigame.root.insertAdjacentHTML('beforeend', '<div role="dialog" id="inner"><button id="i1">x</button></div>');
    assert.equal(MF._innerDialog(MF.currentMinigame.container).id, 'inner');
    close();
});

test('R2 m3: a chained minigame keeps the first opener', () => {
    const btn = document.createElement('div');
    btn.tabIndex = 0;
    btn.id = 'first-opener';
    document.body.appendChild(btn);
    btn.focus();
    MF.startMinigame('demo', null, {});
    assert.equal(MF._focusOpener, btn);
    document.getElementById('a').focus();
    MF.startMinigame('demo2', null, {});
    assert.equal(MF._focusOpener, btn, 'the second minigame does not replace it');
    MF.endMinigame(false, null);
    assert.ok(document.activeElement === btn);
    btn.remove();
});

test('R2 m3: a scene that throws on construction leaves no stale opener', () => {
    class Boom extends MinigameScene { constructor() { super(...arguments); throw new Error('boom'); } }
    MF.registerScene('boom', Boom);
    const btn = document.createElement('div');
    btn.tabIndex = 0;
    document.body.appendChild(btn);
    btn.focus();
    assert.throws(() => MF.startMinigame('boom', null, {}), /boom/);
    assert.equal(MF._focusOpener, null);
    btn.remove();
    close();
});

test('R2 n1/n2: :disabled and contenteditable variants', () => {
    MF.startMinigame('demo', null, {});
    MF.currentMinigame.gameContainer.insertAdjacentHTML('beforeend',
        '<fieldset disabled><button id="fs-btn">x</button></fieldset><div contenteditable id="ce1"></div><div contenteditable="plaintext-only" id="ce2"></div><div contenteditable="false" id="ce3"></div>');
    const ids = MF._trapFocusables(MF.currentMinigame.container).map((el) => el.id);
    assert.ok(!ids.includes('fs-btn'), 'a button in a disabled fieldset is not tabbable');
    assert.ok(ids.includes('ce1') && ids.includes('ce2'));
    assert.ok(!ids.includes('ce3'));
    const bare = document.createElement('button');
    MF.currentMinigame.gameContainer.appendChild(bare);
    bare.matches = undefined;
    assert.equal(MF._isTabbable(bare, MF.currentMinigame.container), true, 'an element without matches does not throw');
    close();
});

test('n1: any negative tabindex is untabbable', () => {
    MF.startMinigame('demo', null, {});
    MF.currentMinigame.gameContainer.insertAdjacentHTML('beforeend', '<div tabindex="-2" id="n2"></div><div tabindex="0" id="z"></div>');
    document.getElementById('t').focus();
    tab();
    assert.equal(active(), 'z');
    close();
});

test('M1: a focused control is scrolled into view', () => {
    MF.startMinigame('demo', null, {});
    let called = null;
    const b = document.getElementById('b');
    b.scrollIntoView = (o) => { called = o; };
    document.getElementById('a').focus();
    tab();
    assert.equal(active(), 'b');
    assert.deepEqual(called, { block: 'nearest', inline: 'nearest' });
    close();
});

test('m4: a mouse-focused button opener is not refocused; a non-button opener is', () => {
    const btn = document.createElement('button');
    btn.id = 'mouse-btn';
    document.body.appendChild(btn);
    btn.matches = (sel) => (sel === ':focus-visible' ? false : dom.window.Element.prototype.matches.call(btn, sel));
    btn.focus();
    MF.startMinigame('demo', null, {});
    document.activeElement.blur();
    MF.endMinigame(false, null);
    assert.ok(document.activeElement !== btn);
    btn.matches = (sel) => (sel === ':focus-visible' ? true : dom.window.Element.prototype.matches.call(btn, sel));
    btn.focus();
    MF.startMinigame('demo', null, {});
    document.activeElement.blur();
    MF.endMinigame(false, null);
    assert.ok(document.activeElement === btn);
    btn.remove();
    const div = document.createElement('div');
    div.tabIndex = 0;
    document.body.appendChild(div);
    div.focus();
    MF.startMinigame('demo', null, {});
    document.activeElement.blur();
    MF.endMinigame(false, null);
    assert.ok(document.activeElement === div);
    div.remove();
    // opener hidden by then: not refocused
    hud.focus();
    hud.matches = (sel) => (sel === ':focus-visible' ? true : dom.window.Element.prototype.matches.call(hud, sel));
    MF.startMinigame('demo', null, {});
    hud.blur();
    hud.style.display = 'none';
    MF.endMinigame(false, null);
    assert.ok(document.activeElement !== hud);
    hud.style.display = '';
    delete hud.matches;
});

test('R3: _innerDialog scene-root branches (parentElement === root, only child of the game container)', () => {
    MF.startMinigame('demo', null, {});
    const m = MF.currentMinigame;
    // a dialog that is a direct child of the minigame container is the scene, not an inner panel
    m.container.insertAdjacentHTML('beforeend', '<div role="dialog" id="top-dlg"><button id="td">x</button></div>');
    assert.equal(MF._innerDialog(m.container), null);
    document.getElementById('top-dlg').remove();
    // the only child of the game container counts as the scene root ...
    m.gameContainer.innerHTML = '<div role="dialog" id="only-dlg"><button id="od">x</button></div>';
    assert.equal(MF._innerDialog(m.container), null);
    // ... but with a sibling beside it, it is an inner dialog
    m.gameContainer.insertAdjacentHTML('beforeend', '<button id="sib">s</button>');
    assert.equal(MF._innerDialog(m.container).id, 'only-dlg');
    close();
});

test('R3 n1: a constructor that throws in a chained start keeps the first opener', () => {
    class Boom2 extends MinigameScene { constructor() { super(...arguments); throw new Error('boom2'); } }
    MF.registerScene('boom2', Boom2);
    const btn = document.createElement('div');
    btn.tabIndex = 0;
    document.body.appendChild(btn);
    btn.focus();
    MF.startMinigame('demo', null, {});
    assert.equal(MF._focusOpener, btn);
    document.getElementById('a').focus();
    // the displaced demo ends first, so currentMinigame is null again when Boom2 constructs;
    // the opener was noted by the first start, and this start (chained) did not note a new one
    assert.throws(() => MF.startMinigame('boom2', null, {}), /boom2/);
    assert.equal(MF._focusOpener, btn, 'the chain owner still holds the opener');
    btn.remove();
    close();
});
