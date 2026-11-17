// Phone landscape (844x390, 667x375, 915x412): the person-chat caption band must stay inside the
// chat box and scroll, so the speaker line and all five choices are reachable. It used to grow
// upward off the screen. The portrait scale logic must stay untouched by the fix.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const css = readFileSync(join(root, 'public/break_escape/css/person-chat-minigame.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const start = css.indexOf('@media (min-width: 601px) and (max-height: 520px)');
assert.ok(start >= 0, 'landscape media query exists');
let depth = 0, end = start;
for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) { end = i; break; }
}
const block = css.slice(css.indexOf('{', start) + 1, end);
const rules = [...block.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));
const body = (sel) => rules.filter((r) => r.sel === sel).map((r) => r.body).join(';');

test('caption is capped to the chat box and scrolls', () => {
    const b = body('.person-chat-caption-area');
    assert.match(b, /max-height:\s*100%/);
    assert.match(b, /overflow-y:\s*auto/);
});
test('caption packs from the start edge so the top of the content can be scrolled to', () => {
    assert.match(body('.person-chat-caption-area'), /align-items:\s*flex-start/);
    assert.match(body('.person-chat-caption-content'), /align-items:\s*flex-start/);
});
test('the query is landscape-only: it starts above the phone layout width', () => {
    assert.ok(start > css.indexOf('.person-chat-caption-area'), 'after the base rule');
});
test('landscape rules leave the portrait sprite scale alone', () => {
    assert.doesNotMatch(block, /pc-portrait-h|portrait-section|canvas|transform|scale/);
});
test('no radius, no font-size change in the landscape block', () => {
    assert.doesNotMatch(block, /border-radius|font-size/);
});
