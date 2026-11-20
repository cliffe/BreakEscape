// R17 F5: task and objective toasts (info/success) stacked over the right two thirds of a
// 900x700 window for their 5 s. Real clicks and the pause-menu centre check landed on the
// toast, and the test bridge reported blocking-ui. A toast is not modal: its body ignores
// clicks, and only the close x takes them.
// Run with: node --test test/js/toast-click-through.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '../../public/break_escape/css/notifications.css'), 'utf8');
const rule = (sel) => {
    const i = css.indexOf(`\n${sel} {`);
    return css.slice(i, css.indexOf('}', i));
};

test('a toast lets clicks through to the game', () => {
    assert.match(rule('.notification'), /pointer-events: none/);
    assert.doesNotMatch(rule('.notification'), /pointer-events: auto/);
});

test('the close x still takes clicks', () => {
    assert.match(rule('.notification-close'), /pointer-events: auto/);
});
