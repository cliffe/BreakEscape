// Title screen continues on a click, Space or Enter (title-screen-input.js; m02 B1/M11/CF-J).
// Run with: node --test test/js/title-screen-input.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/minigames/title-screen/title-screen-input.js');
const dir = mkdtempSync(join(tmpdir(), 'title-screen-input-'));
writeFileSync(join(dir, 'input.mjs'), readFileSync(src, 'utf8'));
const { isContinueKey, attachContinueHandlers, startDesktopHold, DESKTOP_HOLD_MS } = await import(pathToFileURL(join(dir, 'input.mjs')).href);

function target() {
    const t = new EventTarget();
    t.count = (type) => t._n?.[type] ?? 0;
    return t;
}
const key = (k, extra = {}) => Object.assign(new Event('keydown'), { key: k, code: extra.code ?? '', repeat: !!extra.repeat });

test('Space, Enter and numpad Enter continue; other keys do not', () => {
    assert.equal(isContinueKey({ key: ' ', code: 'Space' }), true);
    assert.equal(isContinueKey({ key: 'Enter', code: 'Enter' }), true);
    assert.equal(isContinueKey({ key: 'Enter', code: 'NumpadEnter' }), true);
    assert.equal(isContinueKey({ key: 'a', code: 'KeyA' }), false);
    assert.equal(isContinueKey({ key: 'Escape', code: 'Escape' }), false);
    assert.equal(isContinueKey({ key: 'Enter', code: 'Enter', repeat: true }), false);
});

for (const [name, fire] of [
    ['click', (c, d) => c.dispatchEvent(new Event('click'))],
    ['Space', (c, d) => d.dispatchEvent(key(' ', { code: 'Space' }))],
    ['Enter', (c, d) => d.dispatchEvent(key('Enter', { code: 'Enter' }))],
]) {
    test(`${name} continues exactly once and detaches`, () => {
        const c = target(); const d = target();
        let calls = 0;
        attachContinueHandlers(c, d, () => calls++);
        fire(c, d); fire(c, d);
        c.dispatchEvent(new Event('click'));
        d.dispatchEvent(key('Enter', { code: 'Enter' }));
        assert.equal(calls, 1);
    });
}

test('other keys are ignored', () => {
    const c = target(); const d = target();
    let calls = 0;
    attachContinueHandlers(c, d, () => calls++);
    d.dispatchEvent(key('x', { code: 'KeyX' }));
    assert.equal(calls, 0);
});

test('the title screen uses the shared continue handlers', () => {
    const ts = readFileSync(join(here, '../../public/break_escape/js/minigames/title-screen/title-screen-minigame.js'), 'utf8');
    assert.match(ts, /attachContinueHandlers\(this\.container, document,/);
    assert.match(ts, /Click, or press Space or Enter/);
});

function fakeTimers() {
    const t = { pending: new Map(), next: 1 };
    t.setTimeout = (fn, ms) => { const id = t.next++; t.pending.set(id, { fn, ms }); return id; };
    t.clearTimeout = (id) => { t.pending.delete(id); };
    t.fire = () => { for (const [id, { fn }] of [...t.pending]) { t.pending.delete(id); fn(); } };
    return t;
}

test('desktop hold: proceeds once after the hold with no input', () => {
    const c = target(); const d = target(); const t = fakeTimers();
    let calls = 0;
    startDesktopHold(c, d, DESKTOP_HOLD_MS, () => calls++, t);
    assert.equal(DESKTOP_HOLD_MS, 1200);
    assert.equal([...t.pending.values()][0].ms, 1200);
    assert.equal(calls, 0);
    t.fire();
    assert.equal(calls, 1);
    c.dispatchEvent(new Event('click'));
    assert.equal(calls, 1);
});

for (const [name, fire] of [
    ['click', (c, d) => c.dispatchEvent(new Event('click'))],
    ['Space', (c, d) => d.dispatchEvent(key(' ', { code: 'Space' }))],
    ['Enter', (c, d) => d.dispatchEvent(key('Enter', { code: 'Enter' }))],
]) {
    test(`desktop hold: ${name} skips the hold, once, and clears the timer`, () => {
        const c = target(); const d = target(); const t = fakeTimers();
        let calls = 0;
        startDesktopHold(c, d, 1200, () => calls++, t);
        fire(c, d);
        assert.equal(calls, 1);
        assert.equal(t.pending.size, 0);
        t.fire(); fire(c, d);
        assert.equal(calls, 1);
    });
}

test('desktop hold: cancel stops it', () => {
    const c = target(); const d = target(); const t = fakeTimers();
    let calls = 0;
    const cancel = startDesktopHold(c, d, 1200, () => calls++, t);
    cancel(); t.fire(); c.dispatchEvent(new Event('click'));
    assert.equal(calls, 0);
});
