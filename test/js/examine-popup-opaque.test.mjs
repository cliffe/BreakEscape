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
    const rgba = value.match(/(?:rgba|hsla)\(\s*[^,]+,[^,]+,[^,]+,\s*([\d.]+)(%?)\s*\)/i);
    if (rgba && Number(rgba[1]) / (rgba[2] ? 100 : 1) < 1) return `alpha ${rgba[1]}${rgba[2]}`;
    // Space-separated syntax: rgb(0 0 0 / 80%), hsl(... / .5), rgba(0 0 0 / .8)
    const slash = value.match(/(?:rgba?|hsla?)\([^)]*\/\s*([\d.]+)(%?)\s*\)/i);
    if (slash && Number(slash[1]) / (slash[2] ? 100 : 1) < 1) return `slash alpha ${slash[1]}${slash[2]}`;
    // 4 and 8 digit hex carry an alpha: #rgba, #rrggbbaa
    const hex = value.match(/#([0-9a-f]{4}|[0-9a-f]{8})\b/i);
    if (hex) {
        const h = hex[1];
        const a = h.length === 4 ? h[3] + h[3] : h.slice(6);
        if (a.toLowerCase() !== 'ff') return `hex alpha ${a}`;
    }
    if (/color-mix\([^;]*transparent/i.test(value)) return 'color-mix with transparent';
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
    assert.ok(themes >= 7, `theme surfaces found: ${themes}`);
    assert.ok(opaque >= 7, `opaque tokens found: ${opaque}`);
    assert.ok(opaque === themes, `opaque tokens ${opaque} vs themes ${themes}`);
});

test('toast and text display modal fills are solid (unthemed and themed)', () => {
    const toast = checked('notifications.css', (s) => /^\.notification$/.test(s));
    assert.ok(toast.length === 1, 'one base toast rule: ' + toast.length);
    assert.ok(seeThrough(fills(toast[0].body)[0]) === '', 'toast: ' + fills(toast[0].body)[0]);

    const dialog = checked('notifications.css', (s) => /^\.game-confirm-dialog$/.test(s));
    assert.ok(dialog.length === 1, 'one base dialog rule: ' + dialog.length);
    assert.ok(seeThrough(fills(dialog[0].body)[0]) === '', 'dialog: ' + fills(dialog[0].body)[0]);

    // The shared themed card (confirm and display modal): the panel list sets the translucent
    // surface, the opaque rule after it must win (same specificity, later in the file).
    const t = rules(css('ui-themes.css'));
    const confirmRules = t.map((r, i) => ({ r, i })).filter((x) => x.r.selector.split(',').map((y) => y.trim()).includes('[data-ui-theme] .game-confirm-dialog'));
    assert.ok(confirmRules.length >= 2, 'panel list and opaque rule both name the themed dialog: ' + confirmRules.length);
    const last = confirmRules[confirmRules.length - 1].r;
    assert.ok(fills(last.body)[0] === 'var(--ui-surface-opaque)', 'themed dialog final fill: ' + fills(last.body)[0]);
    assert.ok(last.selector.trim() === '[data-ui-theme] .game-confirm-dialog', 'opaque rule is on the shared selector: ' + last.selector);
});

test('themed toast fill comes from the opaque 9-slice centre, not a translucent colour', () => {
    const themed = checked('ui-themes.css', (s) => s === '[data-ui-theme] .notification');
    assert.ok(themed.length === 1, 'themed toast rule: ' + themed.length);
    assert.ok(/border-image-slice:[^;]*\bfill\b/.test(themed[0].body), 'slice keeps fill');
    for (const f of fills(themed[0].body)) assert.ok(f === 'none', 'toast background: ' + f);
});

test('seeThrough catches every alpha form', () => {
    for (const v of ['#000000cc', '#000c', 'rgb(0 0 0 / 80%)', 'rgba(0 0 0 / .8)', 'hsla(0, 0%, 0%, 0.5)',
        'hsl(0 0% 0% / 50%)', 'color-mix(in srgb, #000 80%, transparent)']) {
        assert.ok(seeThrough(v) !== '', 'flagged: ' + v);
    }
    for (const v of ['#0a0a14', '#000000ff', '#000f', 'rgb(10, 10, 20)', 'rgba(0,0,0,1)', 'rgb(0 0 0 / 100%)']) {
        assert.ok(seeThrough(v) === '', 'solid: ' + v);
    }
});

test('toast opacity does not ease (it would show the room through half-faded text)', () => {
    const base = rules(css('notifications.css')).find((r) => r.selector === '.notification');
    const tr = (base.body.match(/transition\s*:\s*([^;]+)/) || [])[1] || '';
    assert.ok(tr.trim() === 'none', 'transition: ' + tr);
});

test('toast shows in place: no vertical offset to overlap the toast above or the HUD buttons', () => {
    const rs = rules(css('notifications.css'));
    const base = rs.find((r) => r.selector === '.notification');
    const shown = rs.find((r) => r.selector === '.notification.show');
    const tf = (b) => ((b.body.match(/transform\s*:\s*([^;]+)/) || [])[1] || '').trim();
    assert.ok(tf(base) === 'none', 'base transform: ' + tf(base));
    assert.ok(tf(shown) === 'none', 'shown transform: ' + tf(shown));
});

test('removeNotification takes the toast out of the flow at once', () => {
    const js = readFileSync(join(here, '../../public/break_escape/js/systems/notifications.js'), 'utf8');
    const fn = js.slice(js.indexOf('export function removeNotification'), js.indexOf('export function gameAlert'));
    assert.ok(/notification\.style\.display\s*=\s*'none'/.test(fn), 'display none on close');
    assert.ok(fn.indexOf("style.display = 'none'") < fn.indexOf('setTimeout'), 'before the timer');
});
