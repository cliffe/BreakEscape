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

function ruleSizes(text, file) {
    const out = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(text))) {
        const body = m[2];
        const sel = m[1].trim().replace(/\s+/g, ' ');
        if (/^@|keyframes/.test(sel) || !targetsTextControl(sel)) continue;
        if (/::placeholder|::-webkit|::selection/.test(sel)) continue;
        const size = body.match(/(?:^|[;\s])font-size:\s*([\d.]+)(px|em|rem|%)?/);
        const short = body.match(/(?:^|[;\s])font:\s*(?!inherit)[^;]*?([\d.]+)px/);
        const hit = size || short;
        if (!hit) continue;
        const unit = size ? size[2] : 'px';
        const px = unit === 'px' || !unit ? Number(hit[1]) : unit === 'em' || unit === 'rem' ? Number(hit[1]) * 16 : NaN;
        const line = text.slice(0, m.index + m[1].length + 1).split('\n').length;
        out.push({ where: `${file}:${line} ${sel.slice(-70)}`, px });
    }
    return out;
}

const SHEETS = readdirSync(css).filter((f) => f.endsWith('.css'));
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
        for (const r of ruleSizes(t, f)) if (!(r.px >= 16)) bad.push(`${r.where} = ${r.px}px`);
    }
    // the dev-only new-game form keeps its styles in the view
    const erb = stripComments(readFileSync(join(root, 'app/views/break_escape/games/new.html.erb'), 'utf8'));
    for (const r of ruleSizes(erb, 'games/new.html.erb')) if (!(r.px >= 16)) bad.push(`${r.where} = ${r.px}px`);
    assert.ok(bad.length === 0, `text controls under 16px: ${bad.join(' | ')}`);
});

test('the control matcher sees the known text controls (guards against a matcher that finds nothing)', () => {
    const seen = new Set();
    for (const f of SHEETS) {
        const t = stripComments(readFileSync(join(css, f), 'utf8'));
        const re = /([^{}]+)\{/g;
        let m;
        while ((m = re.exec(t))) if (targetsTextControl(m[1].trim().replace(/\s+/g, ' '))) seen.add(f);
    }
    for (const f of ['game-menu.css', 'mail-client-minigame.css', 'music-widget.css', 'notes.css', 'password-minigame.css', 'player_preferences.css', 'modals.css', 'ble-scanner.css', 'inbox-triage-minigame.css']) {
        assert.ok(seen.has(f), `${f} has a rule the matcher recognises as a text control`);
    }
});
