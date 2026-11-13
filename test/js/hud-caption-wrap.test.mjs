// The one-line HUD caption (#hud-info-label) wraps long observation text instead of
// cutting it off with an ellipsis (pass 5, approved item 7.3c; m07 blind run A, M3).
// Run with: node --test test/js/hud-caption-wrap.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '../../public/break_escape/css/hud.css'), 'utf8');

function rule(selector) {
    const start = css.indexOf(`${selector} {`);
    assert.ok(start >= 0, `${selector} rule exists`);
    return css.slice(start, css.indexOf('}', start));
}

test('the caption wraps and never truncates', () => {
    const r = rule('#hud-info-label');
    assert.doesNotMatch(r, /white-space:\s*nowrap/);
    assert.doesNotMatch(r, /text-overflow:\s*ellipsis/);
    assert.doesNotMatch(r, /overflow:\s*hidden/);
    assert.match(r, /white-space:\s*normal/);
    assert.match(r, /overflow-wrap:\s*anywhere/);
});

test('the caption keeps a readable width instead of shrinking to half the screen', () => {
    const r = rule('#hud-info-label');
    assert.match(r, /width:\s*max-content/);
    assert.match(r, /max-width:\s*min\(\d+px,\s*calc\(100vw \/ var\(--hud-zoom, 1\) - 32px\)\)/, "divided by the HUD zoom (R2 m6)");
});

test('on an upright phone the caption sits above Punch and Block (UX slice 16 R2 m6)', () => {
    const r = rule('body:has(#combat-buttons) #hud-info-label');
    const bottom = Number(r.match(/bottom:\s*(\d+)px/)[1]);
    // the row: bottom 116px, 68px buttons (themed), an 11px ring above them
    assert.ok(bottom >= 116 + 68 + 11, 'clear of the combat row');
    const at = css.indexOf('body:has(#combat-buttons) #hud-info-label {');
    const media = css.lastIndexOf('@media', at);
    assert.match(css.slice(media, at), /max-width:\s*899\.98px\) and \(orientation:\s*portrait\)/);
});
