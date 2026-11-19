// The examine popups are opaque: no see-through fill on the card, its boxes, the toast that
// shows a readable object's text, or the text display modal. The dim backdrops behind modals
// (.minigame-container, .game-confirm-overlay) are meant to be translucent and are not checked.
// Run with: node --test test/js/examine-popup-opaque.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const css = (f) => readFileSync(join(here, '../../public/break_escape/css', f), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');

// [{ selector, body }] for the plain (non-@) rules, including those inside @media blocks.
function rules(text) {
    const out = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(text))) {
        const selector = m[1].trim();
        if (selector.startsWith('@')) continue;
        out.push({ selector, body: m[2] });
    }
    return out;
}

// Background declarations (background / background-color) of a rule body.
function fills(body) {
    return [...body.matchAll(/(?:^|;|\s)background(?:-color)?\s*:\s*([^;]+)/g)].map((m) => m[1].trim());
}

// Why a fill value is see-through, or '' when it is solid.
function seeThrough(value) {
    if (/^transparent$/i.test(value)) return 'transparent';
    const rgba = value.match(/rgba\(\s*[^,]+,[^,]+,[^,]+,\s*([\d.]+)\s*\)/i);
    if (rgba && Number(rgba[1]) < 1) return `alpha ${rgba[1]}`;
    if (/(^|[^-])var\(--ui-surface(-raised|-hover)?\)/.test(value) && !/opaque/.test(value)) return 'translucent theme surface';
    return '';
}

function checked(file, selectorTest) {
    return rules(css(file)).filter((r) => selectorTest(r.selector) && fills(r.body).length);
}

test('examine card, image box and text box have solid fills', () => {
    const mine = checked('examine-minigame.css', (s) => /examine/.test(s));
    assert.ok(mine.length >= 3, 'found the examine rules: ' + mine.length);
    for (const r of mine) for (const f of fills(r.body)) {
        assert.ok(seeThrough(f) === '', `${r.selector}: ${f} is ${seeThrough(f)}`);
    }
});

test('themed examine card takes the opaque theme surface', () => {
    const themed = rules(css('ui-themes.css')).filter((r) => /(^|,)\s*\[data-ui-theme\] \.examine-minigame \.minigame-game-container\s*$/.test(
        r.selector.split(',').map((x) => x.trim()).filter((x) => x.includes('examine-minigame')).join(',')));
    const finals = themed.flatMap((r) => fills(r.body));
    assert.ok(finals.length >= 2, 'the shared rule and the examine override both set a fill: ' + finals.length);
    // The rule that wins (the last one in the file) must be opaque
    assert.ok(finals[finals.length - 1] === 'var(--ui-surface-opaque)', 'last fill: ' + finals[finals.length - 1]);
});

test('every theme defines an opaque surface at full alpha', () => {
    const t = css('ui-themes.css');
    const opaque = [...t.matchAll(/--ui-surface-opaque:\s*rgb\(/g)].length;
    const themes = [...t.matchAll(/--ui-surface:\s*rgba/g)].length;
    assert.ok(opaque === themes, `opaque tokens ${opaque} vs themes ${themes}`);
});

test('toast and text display modal fills are solid (unthemed and themed)', () => {
    const toast = checked('notifications.css', (s) => /^\.notification$/.test(s));
    assert.ok(toast.length === 1, 'one base toast rule: ' + toast.length);
    assert.ok(seeThrough(fills(toast[0].body)[0]) === '', 'toast: ' + fills(toast[0].body)[0]);

    const dialog = checked('notifications.css', (s) => /^\.game-confirm-dialog$/.test(s));
    assert.ok(dialog.length === 1, 'one base dialog rule: ' + dialog.length);
    assert.ok(seeThrough(fills(dialog[0].body)[0]) === '', 'dialog: ' + fills(dialog[0].body)[0]);

    const display = checked('ui-themes.css', (s) => /game-display-dialog/.test(s) && /^\[data-ui-theme\] \.game-confirm-dialog\.game-display-dialog$/.test(s));
    assert.ok(display.length === 1, 'themed display modal rule: ' + display.length);
    assert.ok(fills(display[0].body)[0] === 'var(--ui-surface-opaque)', 'display modal: ' + fills(display[0].body)[0]);
});

test('themed toast fill comes from the opaque 9-slice centre, not a translucent colour', () => {
    const themed = checked('ui-themes.css', (s) => s === '[data-ui-theme] .notification');
    assert.ok(themed.length === 1, 'themed toast rule: ' + themed.length);
    assert.ok(/border-image-slice:[^;]*\bfill\b/.test(themed[0].body), 'slice keeps fill');
    for (const f of fills(themed[0].body)) assert.ok(f === 'none', 'toast background: ' + f);
});

test('toast opacity does not ease (it would show the room through half-faded text)', () => {
    const base = rules(css('notifications.css')).find((r) => r.selector === '.notification');
    const tr = (base.body.match(/transition\s*:\s*([^;]+)/) || [])[1] || '';
    assert.ok(tr.trim() === 'transform 0.3s ease', 'transition: ' + tr);
});
