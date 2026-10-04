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
const { isContinueKey, attachContinueHandlers } = await import(pathToFileURL(join(dir, 'input.mjs')).href);

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
