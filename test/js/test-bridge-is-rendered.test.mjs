// The test bridge's visibility check (systems/test-bridge/minigames.js isRendered) must not
// use offsetParent: it is null for position:fixed elements, so a plainly visible control
// (the X) was reported hidden. checkVisibility (with the visibility and opacity checks) is
// used where present, getClientRects otherwise. The function source is lifted from the real file.
// Run with: node test/js/test-bridge-is-rendered.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const src = readFileSync(join(js, 'systems/test-bridge/minigames.js'), 'utf8');
const m = src.match(/export function isRendered\(el\) \{[\s\S]*?\n\}\n/);
assert.ok(m, 'isRendered found');
const dataUrl = 'data:text/javascript;base64,' + Buffer.from(m[0]).toString('base64');
const { isRendered } = await import(dataUrl);

test('a position:fixed control (offsetParent null) is rendered', () => {
    assert.equal(isRendered({ offsetParent: null, getClientRects: () => [{}] }), true);
    assert.equal(isRendered({ offsetParent: null, checkVisibility: () => true, getClientRects: () => [] }), true);
});
test('a hidden control is not rendered', () => {
    assert.equal(isRendered({ offsetParent: null, getClientRects: () => [] }), false);
    assert.equal(isRendered({ offsetParent: {}, checkVisibility: () => false, getClientRects: () => [{}] }), false);
});
test('checkVisibility is asked for the visibility and opacity checks', () => {
    let seen = null;
    isRendered({ checkVisibility: (o) => { seen = o; return true; } });
    assert.deepEqual(seen, { visibilityProperty: true, opacityProperty: true });
});
test('null is not rendered', () => { assert.equal(isRendered(null), false); });
test('no code path reads offsetParent', () => {
    assert.equal(/\.offsetParent\s*[!=]/.test(src), false);
});
