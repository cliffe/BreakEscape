// iOS Safari zooms the whole page when a focused input, select or textarea computes under 16px.
// A control with no size of its own falls back to 13.33px, so each game sheet carries a
// zero-specificity default (:where(input, select, textarea) { font-size: 16px }), and every rule
// that sets a size on a text-entry control must resolve to 16px or more.
// Assertions are booleans with messages on purpose: a failing deepEqual on big structures can
// make node's reporter eat memory.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const css = join(root, 'public/break_escape/css');

// Class names that look like fields but are not focusable text controls (spans, divs, labels,
// containers, or checkbox/radio inputs, which iOS does not zoom for).
const NOT_TEXT_CONTROL = /(label|container|wrapper|row|field-notes|summary|icon|checkbox|radio|toggle|range|slider|tick|chip|menu-field|fields|page-field|lpb-field|attempt-input|has-input|-display|-area|-error|-hint|-help|-note)/;
// Selectors whose last compound targets a text-entry control.
const ELEMENT_CONTROL = /(?:^|[^\w-])(input|select|textarea)(?![\w-])/;
const CLASS_CONTROL = /\.[\w-]*(?:-input|-search|-select|-textarea|-field|form-control|freetext)(?![\w-])|#[\w-]*(?:-input|-search)(?![\w-])/;

function lastCompound(sel) {
    return sel.split(',').map((p) => p.trim().split(/[\s>+~]+/).pop());
}
function targetsTextControl(sel) {
    return lastCompound(sel).some((c) => {
        const bare = c.replace(/::?[\w-]+(\([^)]*\))?/g, '');
        if (/\[type=["']?(checkbox|radio|range|hidden|button|submit|file|color)/.test(bare)) return false;
        if (ELEMENT_CONTROL.test(' ' + bare)) return true;
        return CLASS_CONTROL.test(bare) && !NOT_TEXT_CONTROL.test(bare);
    });
}

function stripComments(t) { return t.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' ')); }

// The zoomed HUD boxes (game menu, password modal, player-prefs modal, music widget panel) set
// "zoom: var(--hud-zoom)". "Smaller" HUD size can take --hud-zoom to 1/dpr, and WebKit folds zoom
// into the computed size, so these controls divide it back: max(Npx, calc(Npx / var(--hud-zoom, 1))).
// Rendered size is then at least N whatever the zoom. That exact form resolves to N.
const COMPENSATED = /^max\(\s*([\d.]+)px\s*,\s*calc\(\s*\1px\s*\/\s*var\(--hud-zoom,\s*1\)\s*\)\s*\)$/;

// A size that is not a plain px or rem number cannot be read from the sheet. It fails unless an
// entry here gives the file, a piece of the selector, the exact value, the px it resolves to
// and the reason.
const ALLOW_UNRESOLVED = [
    { file: 'player_preferences.css', sel: '.shell-picker .form-control', value: 'inherit', px: 20.5,
        reason: 'inherits body.shell-picker font-size: 20.5px (player_preferences.css)' },
];

function resolveValue(raw) {
    const v = raw.replace(/!important/, '').trim();
    let m = v.match(/^([\d.]+)px$/);
    if (m) return { px: Number(m[1]) };
    m = v.match(/^([\d.]+)rem$/);
    if (m) return { px: Number(m[1]) * 16 };
    m = v.match(COMPENSATED);
    if (m) return { px: Number(m[1]), compensated: true };
    return { px: NaN, unresolved: v };
}

function ruleSizes(text, file) {
    const out = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(text))) {
        const body = m[2];
        const sel = m[1].trim().replace(/\s+/g, ' ');
        if (/^@|keyframes/.test(sel) || !targetsTextControl(sel)) continue;
        if (/::placeholder|::-webkit|::selection/.test(sel)) continue;
        const size = body.match(/(?:^|[;\s])font-size:\s*([^;}]+)/);
        const short = body.match(/(?:^|[;\s])font:\s*([^;}]+)/);
        let raw = null;
        if (size) raw = size[1];
        else if (short) {
            const px = short[1].match(/(?:^|\s)([\d.]+)px(?=\/|\s|$)/);
            raw = px ? `${px[1]}px` : short[1];
        }
        if (raw === null) continue;
        const line = text.slice(0, m.index + m[1].length + 1).split('\n').length;
        out.push({ where: `${file}:${line} ${sel.slice(-70)}`, file, sel, raw: raw.trim(), ...resolveValue(raw) });
    }
    return out;
}

// every problem with one rule: under 16px, or not readable and not on the allowlist
function problems(r) {
    if (r.unresolved !== undefined) {
        const ok = ALLOW_UNRESOLVED.find((a) => a.file === r.file && r.sel.includes(a.sel) && a.value === r.unresolved);
        if (!ok) return `${r.where} = "${r.unresolved}" (not a plain px size: resolve it or add an ALLOW_UNRESOLVED entry with px and reason)`;
        return ok.px >= 16 && ok.reason ? null : `${r.where} allowlist entry resolves under 16px or has no reason`;
    }
    return r.px >= 16 ? null : `${r.where} = ${r.px}px`;
}

function listCss(dir, rel = '') {
    const out = [];
    for (const e of readdirSync(join(dir, rel), { withFileTypes: true })) {
        if (e.isDirectory()) out.push(...listCss(dir, join(rel, e.name)));
        else if (e.name.endsWith('.css')) out.push(join(rel, e.name));
    }
    return out;
}
function listJs(dir) {
    const out = [];
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) out.push(...listJs(p));
        else if (e.name.endsWith('.js')) out.push(p);
    }
    return out;
}

const SHEETS = listCss(css);
const DEFAULT_RULE = /:where\(\s*input\s*,\s*select\s*,\s*textarea\s*\)\s*\{[^}]*font-size:\s*16px/;

test('the game sheets carry the zero-specificity 16px default for input, select and textarea', () => {
    for (const f of ['main.css', 'minigames-framework.css']) {
        const t = stripComments(readFileSync(join(css, f), 'utf8'));
        assert.ok(DEFAULT_RULE.test(t), `${f} has :where(input, select, textarea) { font-size: 16px }`);
    }
});

test('no text-entry control rule resolves under 16px', () => {
    const bad = [];
    for (const f of SHEETS) {
        const t = stripComments(readFileSync(join(css, f), 'utf8'));
        for (const r of ruleSizes(t, f)) { const p = problems(r); if (p) bad.push(p); }
    }
    // styles written by JS: <style> blocks in templates and `style.textContent = \`...\`` (the flag
    // station keeps its field styles that way)
    let jsStyleBlocks = 0;
    for (const f of listJs(join(root, 'public/break_escape/js'))) {
        const src = readFileSync(f, 'utf8');
        if (!src.includes('<style') && !/createElement\(['"]style['"]\)/.test(src)) continue;
        const blocks = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1])
            .concat([...src.matchAll(/(?:textContent|innerHTML)\s*=\s*`([^`]*)`/g)].map((m) => m[1]).filter((s) => s.includes('{')));
        for (const blk of blocks) {
            jsStyleBlocks++;
            for (const r of ruleSizes(stripComments(blk), f.slice(root.length + 1))) { const p = problems(r); if (p) bad.push(p); }
        }
    }
    assert.ok(jsStyleBlocks > 0, 'the scan found the JS-written style blocks (flag station)');
    // the dev-only new-game form keeps its styles in the view
    const erb = stripComments(readFileSync(join(root, 'app/views/break_escape/games/new.html.erb'), 'utf8'));
    for (const r of ruleSizes(erb, 'games/new.html.erb')) { const p = problems(r); if (p) bad.push(p); }
    assert.ok(bad.length === 0, `text controls under 16px or not readable: ${bad.join(' | ')}`);
});

test('the control matcher sees the known text controls (guards against a matcher that finds nothing)', () => {
    const seen = new Set();
    for (const f of SHEETS) {
        const t = stripComments(readFileSync(join(css, f), 'utf8'));
        const re = /([^{}]+)\{/g;
        let m;
        while ((m = re.exec(t))) if (targetsTextControl(m[1].trim().replace(/\s+/g, ' '))) seen.add(f);
    }
    for (const f of ['game-menu.css', 'mail-client-minigame.css', 'music-widget.css', 'notes.css', 'password-minigame.css', 'player_preferences.css', 'ble-scanner.css', 'inbox-triage-minigame.css']) {
        assert.ok(seen.has(f), `${f} has a rule the matcher recognises as a text control`);
    }
});

// "Smaller" HUD size can drop --hud-zoom to 1/dpr (main.js), so a control inside a zoomed HUD box
// must divide the zoom back. Each one is named here with the size it must keep.
const ZOOMED_CONTROLS = [
    { file: 'game-menu.css', sel: '.game-menu-field select', px: 16 },
    // #password-modal-input (24px) was removed with the retired, caller-less password modal.
    { file: 'music-widget.css', sel: '.mw-select', px: 16 },
    { file: 'player_preferences.css', sel: '.player-preferences-modal-content .form-control', px: 16 },
];

test('controls inside the zoomed HUD boxes divide --hud-zoom back so the rendered size holds', () => {
    for (const z of ZOOMED_CONTROLS) {
        const rules = ruleSizes(stripComments(readFileSync(join(css, z.file), 'utf8')), z.file)
            .filter((r) => r.sel === z.sel || r.sel.endsWith(' ' + z.sel));
        assert.ok(rules.length > 0, `${z.file} has a ${z.sel} size rule`);
        const last = rules[rules.length - 1];
        assert.ok(last.compensated === true, `${z.file} ${z.sel} uses max(Npx, calc(Npx / var(--hud-zoom, 1))), found "${last.raw}"`);
        assert.ok(last.px === z.px, `${z.file} ${z.sel} keeps ${z.px}px, found ${last.px}`);
    }
});

test('the resolver rejects every non-px form it cannot read', () => {
    for (const v of ['inherit', 'var(--x)', 'calc(1px + 2px)', '1.1em', '80%', 'smaller', 'max(16px, 2em)', 'max(16px, calc(20px / var(--hud-zoom, 1)))']) {
        const r = resolveValue(v);
        assert.ok(r.unresolved !== undefined, `"${v}" is not resolvable`);
    }
    assert.ok(resolveValue('16px').px === 16, '16px resolves');
    assert.ok(resolveValue('1rem').px === 16, '1rem resolves to 16');
    assert.ok(resolveValue('max(16px, calc(16px / var(--hud-zoom, 1)))').px === 16, 'compensation resolves to 16');
});
