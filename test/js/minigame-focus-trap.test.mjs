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
    assert.equal(document.activeElement, MF.currentMinigame.container.querySelectorAll('#a, #b, #t, #minigame-close')[3]);
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

test('an inner aria-modal or listbox keeps its own Tab; an inner plain dialog is still trapped', () => {
    MF.startMinigame('demo', null, {});
    const host = MF.currentMinigame.gameContainer;
    host.insertAdjacentHTML('beforeend', '<div aria-modal="true"><button id="in-modal">M</button></div>'
        + '<ul role="listbox"><li tabindex="0" id="opt">o</li></ul><div role="dialog"><button id="in-dialog">D</button></div>');
    document.getElementById('in-modal').focus();
    assert.equal(tab().defaultPrevented, false);
    document.getElementById('opt').focus();
    assert.equal(tab().defaultPrevented, false);
    document.getElementById('in-dialog').focus();
    assert.equal(tab().defaultPrevented, true);
    assert.ok(MF.currentMinigame.container.contains(document.activeElement));
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
    assert.equal(document.activeElement, hud);
    assert.equal(MF._trapHandler, null);
});

test('opener survives a chain (displacing start, returnTo reopen) and is not forced over other focus', () => {
    hud.focus();
    MF.startMinigame('demo', null, { suspended: true });
    MF.startMinigame('demo2', null, { returnTo: { sceneType: 'demo', params: {} } });
    MF.endMinigame(true, {});
    MF.endMinigame(true, {});
    assert.equal(document.activeElement, hud);
    // something else took focus during close: leave it
    hud.focus();
    MF.startMinigame('demo', null, { onComplete: () => outside.focus() });
    MF.endMinigame(false, null);
    assert.equal(document.activeElement, outside);
});
