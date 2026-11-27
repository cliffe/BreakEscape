// B1: the phone-width padding override must keep the 44px top clearance for the X.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '../../public/break_escape/css/examine-minigame.css'), 'utf8');
const phone = css.slice(css.indexOf('@media (max-width: 600px)'));
const m = phone.match(/\.examine-panel\s*\{([^}]*)\}/);

test('phone examine panel keeps 44px above the content for the X', () => {
    assert.ok(m !== null, 'a .examine-panel rule in the 600px block');
    const decl = m[1].replace(/\/\*[\s\S]*?\*\//g, '');
    const pad = decl.match(/(?:^|[;\s])padding:\s*([^;]+);/);
    const top = decl.match(/padding-top:\s*(\d+)px/);
    const first = pad ? pad[1].trim().split(/\s+/)[0] : '';
    assert.ok((top && Number(top[1]) >= 44) || first === '44px', 'top padding at least 44px, got ' + decl.trim());
});

test('the card scrolls inside the viewport on short landscape', () => {
    const rule = css.match(/\.examine-minigame \.minigame-game-container\s*\{([^}]*)\}/);
    assert.ok(rule !== null, 'the card rule');
    const body = rule[1].replace(/\/\*[\s\S]*?\*\//g, '');
    // vh first for browsers without dvh, dvh after it so it wins where it parses (iOS toolbar)
    const heights = [...body.matchAll(/max-height:\s*([^;]+);/g)].map((x) => x[1].trim());
    assert.deepEqual(heights, ['calc(100vh - 32px)', 'calc(100dvh - 32px)'], 'vh fallback then dvh, in that order');
    assert.ok(/overflow-y:\s*auto/.test(body), 'scrolling');
});

// Round 1 fixes
test('long unbroken name and caption wrap instead of widening the card (m1)', () => {
    for (const sel of ['\\.examine-name', '\\.examine-observations']) {
        const r = css.match(new RegExp('(?:^|\\n)' + sel + '\\s*\\{([^}]*)\\}'));
        assert.ok(r !== null && /overflow-wrap:\s*(anywhere|break-word)/.test(r[1]), sel + ' has overflow-wrap');
    }
});

test('a sticky strip keeps scrolling content clear of the X (m2)', () => {
    const r = css.match(/\.examine-panel::before\s*\{([^}]*)\}/);
    assert.ok(r !== null, 'a .examine-panel::before rule');
    assert.ok(/position:\s*sticky/.test(r[1]) && /top:\s*0/.test(r[1]), 'sticky at top 0');
    const h = r[1].match(/height:\s*(\d+)px/);
    assert.ok(h !== null && Number(h[1]) >= 44, 'strip at least 44px tall');
});
