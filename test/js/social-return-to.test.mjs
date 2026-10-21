// Return-to for nested overlays (SE contract 00 S12, plan item 0.9), the keyboard pause
// across the hand-back (spike F5) and the social overlay helper (item 0.10).
// Run with: bundle exec node --test test/js/social-return-to.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = (rel) => readFileSync(join(js, rel), 'utf8');

// The real framework files, copied with their relative layout into an ESM folder
const dir = mkdtempSync(join(tmpdir(), 'social-return-to-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['minigames/framework/minigame-manager.js', 'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js', 'utils/display-dashes.js', 'ui/modal-stack.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), read(rel));
}

// ── A small DOM: keydown listeners in capture-then-bubble order, plain elements ──
const listeners = [];
function el(tag = 'div') {
    const node = {
        tagName: tag.toUpperCase(), children: [], attrs: {}, style: {}, dataset: {}, className: '',
        textContent: '', type: '', parent: null, removed: false,
        classList: { toggle() {}, add() {}, remove() {} },
        appendChild(c) { c.parent = node; node.children.push(c); return c; },
        remove() { node.removed = true; },
        setAttribute(k, v) { node.attrs[k] = String(v); },
        hasAttribute(k) { return k in node.attrs; },
        addEventListener(t, fn) { (node._l ||= {})[t] = fn; },
        removeEventListener(t) { if (node._l) delete node._l[t]; },
        click() { node._l?.click?.({}); },
        contains(other) { for (let n = other; n; n = n.parent) if (n === node) return true; return false; },
        matches(sel) { return /input|textarea/.test(sel) && /^(INPUT|TEXTAREA)$/.test(node.tagName); },
        blur() { if (globalThis.document.activeElement === node) globalThis.document.activeElement = globalThis.document.body; },
        querySelectorAll() { return []; },
    };
    return node;
}
globalThis.document = {
    body: el('body'),
    activeElement: null,
    createElement: (t) => el(t),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: (type, fn, capture) => { if (type === 'keydown') listeners.push({ fn, capture: !!capture }); },
    removeEventListener: (type, fn) => {
        const i = listeners.findIndex((l) => l.fn === fn);
        if (i !== -1) listeners.splice(i, 1);
    },
};
document.activeElement = document.body;
function press(key, extra = {}) {
    const ev = { key, repeat: false, stopped: false, prevented: false, ...extra,
        preventDefault() { this.prevented = true; },
        stopPropagation() { this.stopped = true; },
        stopImmediatePropagation() { this.stopped = true; } };
    const ordered = [...listeners.filter((l) => l.capture), ...listeners.filter((l) => !l.capture)];
    for (const l of ordered) { if (ev.stopped) break; l.fn(ev); }
    return ev;
}

// ── The world keys: player.js's real pause/resume and a keydown handler shaped like its own ──
const playerSrc = read('core/player.js');
const pauseSrc = playerSrc.match(/export function pauseKeyboardInput\(\) \{[\s\S]*?\n\}/)[0];
const resumeSrc = playerSrc.match(/export function resumeKeyboardInput\(\) \{[\s\S]*?\n\}/)[0];
const world = new Function('log', `
    let keyboardPaused = false; let isKeyboardMoving = false;
    const keyboardInput = {}; const console = { log() {} };
    ${pauseSrc.replace('export ', '')}
    ${resumeSrc.replace('export ', '')}
    return {
        pauseKeyboardInput, resumeKeyboardInput,
        isPaused: () => keyboardPaused,
        keydown(e) { if (keyboardPaused) return; if (e.key === ' ') log.push('jump'); if (e.key === 'e') log.push('interact'); }
    };`)(globalThis.worldLog = []);
document.addEventListener('keydown', (e) => world.keydown(e)); // bubble, like player.js

globalThis.window = {
    pauseKeyboardInput: world.pauseKeyboardInput,
    resumeKeyboardInput: world.resumeKeyboardInput,
    eventDispatcher: { events: [], emit(name, data) { this.events.push({ name, data }); } },
};
globalThis.console = { ...console, log() {} }; // the framework logs a lot

const { MinigameFramework: FW } = await import(pathToFileURL(join(dir, 'minigames/framework/minigame-manager.js')).href);
const { MinigameScene } = await import(pathToFileURL(join(dir, 'minigames/framework/base-minigame.js')).href);
const { SocialOverlayScene, socialOverlayParams } =
    await import(pathToFileURL(join(dir, 'minigames/framework/social-overlay.js')).href);
const { registerModal } = await import(pathToFileURL(join(dir, 'ui/modal-stack.js')).href);
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });

// Scenes that skip the base DOM template (the framework is what is under test)
class Plain extends MinigameScene { init() {} }
class Overlay extends SocialOverlayScene {
    init() {}
    closeResult() { return { collected: ['fact_a'] }; }
    returnParams() { return { restored: true }; }
    saveDraft() { (this.params.drafts ||= []).push('saved'); }
}
FW.registerScene('parent', Plain);
FW.registerScene('child', Plain);
FW.registerScene('grandchild', Plain);
FW.registerScene('board', Overlay);
FW.registerScene('browser', Overlay);

function reset() {
    while (FW.currentMinigame) FW.forceCloseMinigame();
    world.resumeKeyboardInput();
    worldLog.length = 0;
    window.eventDispatcher.events.length = 0;
}
const calls = [];
const record = (name) => (success, result) => calls.push({ name, success, result, open: FW.currentMinigame?._sceneType ?? null });

// ── 0.9: return-to ──

test('returnTo reopens the parent after the child\'s onComplete, on a normal exit', () => {
    reset(); calls.length = 0;
    const parent = FW.startMinigame('parent', null, { onComplete: record('parent') });
    parent.params.suspended = true;
    const child = FW.startMinigame('child', null, { onComplete: record('child'),
        returnTo: { sceneType: 'parent', params: { accountId: 'a1' } } });
    assert.deepEqual(calls, [], 'the suspended parent\'s onComplete(false, null) is skipped');
    assert.equal(FW.currentMinigame, child);
    child.gameResult = { built: true };
    child.complete(true);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], { name: 'child', success: true, result: { built: true }, open: 'child' },
        'onComplete runs first, while the ending child is still current and before the parent reopens');
    const back = FW.currentMinigame;
    assert.equal(back._sceneType, 'parent');
    assert.notEqual(back, parent, 'a fresh instance');
    assert.equal(back.params.accountId, 'a1', 'returnTo.params merged in');
    assert.equal(back.params.suspended, false);
    assert.equal(typeof back.params.onComplete, 'function', 'the parent\'s own onComplete survives');
    back.complete(true);
    assert.equal(calls[1].name, 'parent');
    assert.equal(FW.currentMinigame, null);
});

test('no return on a failure close, an aborted result or a forced close', () => {
    for (const end of [
        (c) => c.complete(false),
        (c) => { c.gameResult = { aborted: true }; c.complete(true); },
        (c) => { c.gameResult = { aborted: true }; c.complete(false); },
        () => FW.forceCloseMinigame(),
        () => FW.endMinigame(false, null), // npc-manager's forced conversation path
    ]) {
        reset();
        const p = FW.startMinigame('parent', null, {});
        p.params.suspended = true;
        const c = FW.startMinigame('child', null, { returnTo: { sceneType: 'parent', params: {} } });
        end(c);
        assert.equal(FW.currentMinigame, null, String(end));
    }
});

test('a child\'s onComplete that opens something itself wins over returnTo', () => {
    reset();
    const p = FW.startMinigame('parent', null, {});
    p.params.suspended = true;
    const c = FW.startMinigame('child', null, {
        onComplete: () => FW.startMinigame('grandchild', null, {}),
        returnTo: { sceneType: 'parent', params: {} } });
    c.complete(true);
    assert.equal(FW.currentMinigame._sceneType, 'grandchild');
});

test('a launch that never starts clears suspended on the parent', () => {
    reset(); calls.length = 0;
    const p = FW.startMinigame('parent', null, { onComplete: record('parent') });
    p.params.suspended = true;
    assert.equal(FW.startMinigame('no-such-scene', null, { returnTo: { sceneType: 'parent' } }), null);
    assert.equal(FW.currentMinigame, p);
    assert.equal(p.params.suspended, false);
    window.playerIsKnockedOut = () => true;
    p.params.suspended = true;
    assert.equal(FW.startMinigame('child', null, {}), null);
    assert.equal(p.params.suspended, false);
    delete window.playerIsKnockedOut;
    p.complete(false);
    assert.equal(calls.length, 1, 'its onComplete still runs on a later close');
});

test('chains unwind one level per normal close: grandchild -> child -> parent', () => {
    reset();
    const p = FW.startMinigame('parent', null, { requiresKeyboardInput: true, tag: 'P' });
    p.params.suspended = true;
    const c = FW.startMinigame('child', null, { tag: 'C', returnTo: { sceneType: 'parent', params: {} } });
    c.params.suspended = true;
    const g = FW.startMinigame('grandchild', null, { returnTo: { sceneType: 'child', params: {} } });
    g.complete(true);
    const c2 = FW.currentMinigame;
    assert.equal(c2._sceneType, 'child');
    assert.equal(c2.params.tag, 'C');
    assert.equal(c2.params.returnTo.sceneType, 'parent', 'the child keeps its own way home');
    c2.complete(true);
    assert.equal(FW.currentMinigame._sceneType, 'parent');
    assert.equal(FW.currentMinigame.params.tag, 'P');
    assert.equal(world.isPaused(), true);
});

test('without returnTo or suspended a displaced minigame behaves as before', () => {
    reset(); calls.length = 0;
    FW.startMinigame('parent', null, { onComplete: record('parent'), requiresKeyboardInput: true });
    FW.startMinigame('child', null, { onComplete: record('child') });
    assert.deepEqual(calls.map((c) => [c.name, c.success, c.result]), [['parent', false, null]]);
    assert.equal(world.isPaused(), false, 'no keyboard inheritance without suspended');
    FW.currentMinigame.complete(true);
    assert.equal(FW.currentMinigame, null, 'nothing reopens');
});

// ── Spike F5: the keyboard pause across the hand-back ──

test('F5: the world stays paused through child and return, and wakes when the parent closes', () => {
    reset();
    const p = FW.startMinigame('parent', null, { requiresKeyboardInput: true });
    press(' '); press('e');
    assert.deepEqual(worldLog, [], 'paused under the parent');
    p.params.suspended = true;
    const c = FW.startMinigame('child', null, { returnTo: { sceneType: 'parent', params: {} } });
    assert.equal(world.isPaused(), true, 'a child without requiresKeyboardInput inherits the pause');
    press(' '); press('e');
    assert.deepEqual(worldLog, [], 'paused under the child');
    c.complete(true);
    assert.equal(FW.currentMinigame._sceneType, 'parent');
    assert.equal(world.isPaused(), true, 'paused again under the reopened parent');
    press(' '); press('e');
    assert.deepEqual(worldLog, []);
    FW.currentMinigame.complete(true);
    assert.equal(world.isPaused(), false);
    press(' ');
    assert.deepEqual(worldLog, ['jump'], 'awake once the parent closes');
});

test('F5: the returnTo params alone (e.g. { accountId }) do not drop the pause', () => {
    reset();
    const p = FW.startMinigame('parent', null, { requiresKeyboardInput: true, disableClose: true });
    p.params.suspended = true;
    FW.startMinigame('child', null, { requiresKeyboardInput: true,
        returnTo: { sceneType: 'parent', params: { accountId: 'a1' } } }).complete(true);
    assert.equal(FW.currentMinigame.params.requiresKeyboardInput, true);
    assert.equal(FW.currentMinigame.params.disableClose, true);
    assert.equal(world.isPaused(), true);
});

test('F5: the pause is one boolean in player.js (no count), so it is the return that re-pauses', () => {
    assert.match(pauseSrc, /keyboardPaused = true;/);
    assert.match(resumeSrc, /keyboardPaused = false;/);
    // the order inside endMinigame that makes the hand-back safe: resume, onComplete, then returnTo,
    // all in one synchronous call, so no keydown can arrive between them
    const mgr = read('minigames/framework/minigame-manager.js');
    const end = mgr.slice(mgr.indexOf('    endMinigame(success, result) {'));
    const iResume = end.indexOf('window.resumeKeyboardInput()');
    const iComplete = end.indexOf('ending.params.onComplete(success, result)');
    const iReturn = end.indexOf('this._startReturnTo(');
    assert.ok(iResume > 0 && iResume < iComplete && iComplete < iReturn);
});

// ── 0.10: the overlay helper ──

test('helper: params default to keyboard pause and the overlay\'s own close', () => {
    assert.deepEqual(socialOverlayParams({ title: 'T' }), { requiresKeyboardInput: true, disableClose: true, title: 'T' });
    assert.equal(socialOverlayParams({ requiresKeyboardInput: false }).requiresKeyboardInput, false);
});

test('helper: Esc closes the top layer, then blurs a field, then closes as a normal exit', () => {
    reset();
    const b = FW.startMinigame('board', el('div'), socialOverlayParams({}));
    let pickerOpen = true;
    const pop = b.pushLayer(() => { pickerOpen = false; pop(); }, 'picker');
    assert.deepEqual(b.getTestState().overlay.layers, ['picker']);
    const first = press('Escape');
    assert.equal(pickerOpen, false);
    assert.equal(first.stopped, true);
    assert.equal(FW.currentMinigame, b);
    const field = b.container.appendChild(el('input'));
    document.activeElement = field;
    press('Escape');
    assert.equal(document.activeElement, document.body, 'blurred, still open');
    assert.equal(FW.currentMinigame, b);
    press('Escape', { repeat: true });
    assert.equal(FW.currentMinigame, b, 'held Esc does not close');
    press('Escape');
    assert.equal(FW.currentMinigame, null);
    const ev = window.eventDispatcher.events.at(-1);
    assert.equal(ev.name, 'minigame_completed');
    assert.deepEqual(ev.data.result, { collected: ['fact_a'] });
    assert.equal(listeners.filter((l) => l.capture).length, 0, 'capture listener removed');
});

test('helper: Esc stands aside while a gameDisplay/gameConfirm dialog is open', () => {
    reset();
    const b = FW.startMinigame('board', el('div'), socialOverlayParams({}));
    let closed = 0;
    const un = registerModal(() => { closed++; un(); });
    press('Escape');
    assert.equal(closed, 1);
    assert.equal(FW.currentMinigame, b, 'only the dialog closed');
    b.close();
});

test('helper: Close control; closeMode abort gives { aborted: true } and complete(false)', () => {
    reset();
    const b = FW.startMinigame('board', el('div'), socialOverlayParams({}));
    const btn = b.mountCloseControl();
    assert.equal(btn.textContent, 'Close');
    btn.click();
    assert.equal(FW.currentMinigame, null);
    assert.equal(window.eventDispatcher.events.at(-1).name, 'minigame_completed');

    class Mail extends Overlay { get closeMode() { return 'abort'; } }
    FW.registerScene('mail', Mail);
    const m = FW.startMinigame('mail', el('div'), socialOverlayParams({}));
    m.mountCloseControl().click();
    const ev = window.eventDispatcher.events.at(-1);
    assert.equal(ev.name, 'minigame_failed');
    assert.deepEqual(ev.data.result, { aborted: true });
});

test('helper: launchChild saves the draft, suspends and comes back on the child\'s close', () => {
    reset(); calls.length = 0;
    const b = FW.startMinigame('browser', el('div'), socialOverlayParams({ onComplete: record('browser') }));
    const board = b.launchChild('board', socialOverlayParams({ mode: 'recon' }));
    assert.deepEqual(b.params.drafts, ['saved']);
    assert.deepEqual(calls, [], 'the browser\'s onComplete is not run on suspend');
    assert.equal(board.getTestState().overlay.returnsTo, 'browser');
    board.close();
    const back = FW.currentMinigame;
    assert.equal(back._sceneType, 'browser');
    assert.equal(back.params.restored, true);
    assert.equal(world.isPaused(), true);
    back.close();
    assert.equal(calls.length, 1);
    assert.equal(calls[0].success, true);
    assert.equal(world.isPaused(), false);
});

test('helper: a failed launchChild leaves the overlay open and not suspended', () => {
    reset();
    const b = FW.startMinigame('browser', el('div'), socialOverlayParams({}));
    assert.equal(b.launchChild('missing-scene', {}), null);
    assert.equal(FW.currentMinigame, b);
    assert.equal(b.params.suspended, false);
    b.close();
});
