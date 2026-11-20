// Sweep 5 "fit": the landing-page builder panel is opaque in every state, and the concern form's
// Start button stays in view on short landscape. CSS pins; the live check measures the rects.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const css = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'break_escape', 'css');
const read = (f) => readFileSync(join(css, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

function rule(src, selector) {
    const out = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(src))) {
        if (m[1].split(',').some((s) => s.trim() === selector)) out.push(m[2]);
    }
    return out;
}

test('lpb-game-container background is opaque (invalid and captures states share it)', () => {
    const decls = rule(read('landing-page-builder-minigame.css'), '.lpb-game-container');
    const withBg = decls.filter((d) => /(^|[;\s])background(-color)?:/.test(d));
    assert.ok(withBg.length >= 1, 'a .lpb-game-container rule sets a background');
    assert.ok(withBg.every((d) => !/rgba/.test(d)), 'no rgba background in any rule');
    const bg = /background:\s*([^;]+);/.exec(withBg[0]);
    assert.ok(!!bg, 'has a background');
    assert.ok(/--ui-surface-opaque/.test(bg[1]), 'uses --ui-surface-opaque');
    assert.ok(!/rgba|--ui-surface,/.test(bg[1]), 'no translucent colour: ' + bg[1]);
});

test('concern form short landscape: Start sticks to the stage bottom', () => {
    const src = read('concern-form-minigame.css');
    const i = src.indexOf('@media (max-height: 500px)');
    assert.ok(i >= 0, 'has a max-height 500px block');
    const block = src.slice(i);
    const start = /\.cf-intro \.cf-start\s*\{([^}]*)\}/.exec(block);
    assert.ok(!!start, 'rule for .cf-intro .cf-start');
    assert.ok(/position:\s*sticky/.test(start[1]), 'sticky');
    assert.ok(/bottom:\s*\d+px/.test(start[1]), 'bottom offset');
    assert.ok(!/font-size/.test(block), 'no font-size in the short-landscape block');
    assert.ok(/\.cf-panel\s*\{[^}]*max-width:\s*none/.test(block), 'panel uses the full width');
});

test('concern form: the min-height 44px touch target is untouched', () => {
    const decls = rule(read('concern-form-minigame.css'), '.cf-button');
    assert.ok(decls.some((d) => /min-height:\s*44px/.test(d)), '44px');
});
