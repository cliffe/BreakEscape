// Post-release UI rule polish (fix/ui-rule-polish): CSS-source pins so each fix fails on regression.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const css = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public/break_escape/css');
const read = (f) => readFileSync(join(css, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
// Body of the first plain rule whose selector is exactly `sel`.
function body(file, sel) {
    const re = /([^{}]+)\{([^{}]*)\}/g;
    const t = read(file);
    let m;
    while ((m = re.exec(t))) if (m[1].trim() === sel) return m[2];
    return null;
}

// Every rule (any selector in a list, any compound or state) whose selectors name class `cls`.
function rulesFor(file, cls) {
    const re = /([^{}]+)\{([^{}]*)\}/g;
    const t = read(file);
    const tok = new RegExp('\\.' + cls.replace(/^\./, '') + '(?![\\w-])');
    const out = [];
    let m;
    while ((m = re.exec(t))) if (m[1].split(',').some((s) => tok.test(s))) out.push({ sel: m[1].trim(), body: m[2] });
    return out;
}

test('triage jump select has a 2px border and stays border-box full width', () => {
    const b = body('inbox-triage-minigame.css', '.tri-jump-select');
    assert.ok(b !== null, 'rule exists');
    assert.ok(/border:\s*2px solid/.test(b), 'border is 2px');
    assert.ok(!/border:\s*1px/.test(b), 'no 1px border');
    assert.ok(/box-sizing:\s*border-box/.test(b) && /width:\s*100%/.test(b), 'layout unchanged');
    for (const r of rulesFor('inbox-triage-minigame.css', 'tri-jump-select')) {
        for (const m of r.body.matchAll(/(?:^|[;\s])border(?:-width)?\s*:\s*([^;]+)/g)) assert.ok(/^2px/.test(m[1].trim()), `rule (${r.sel}) border is 2px, not ${m[1].trim()}`);
    }
});

// The password modal had no caller (showPasswordModal was dead code with a Cancel button and no X),
// so it was retired. Pin that it stays gone so a stale copy is not restored without an X close.
test('retired password modal leaves no CSS rule behind', () => {
    for (const f of readdirSync(css).filter((n) => n.endsWith('.css'))) {
        assert.ok(!/password-modal/.test(read(f)), `${f} has no password-modal selector`);
    }
    for (const f of ['js/systems/tutorial-manager.js', 'js/ui/hud-lanes.js']) {
        assert.ok(!/password-modal/.test(readFileSync(join(css, '..', f), 'utf8')), `${f} has no password-modal selector`);
    }
    const ref = readFileSync(join(css, '..', 'index.html.reference'), 'utf8');
    assert.ok(!/password-modal/.test(ref), 'index.html.reference has no password modal markup');
});

test('forensic data platform GNF controls sit on the 16px grid, GNF face, whole-px spacing', () => {
    const f = 'forensic-data-platform-minigame.css';
    for (const sel of ['.fdp-tab', '.fdp-confirm-btn']) {
        const b = body(f, sel);
        assert.ok(b !== null, `${sel} rule exists`);
        assert.ok(/font-size:\s*16px/.test(b), `${sel} is 16px`);
        assert.ok(/font-family:\s*'GNF'/.test(b), `${sel} names GNF`);
        for (const r of rulesFor(f, sel)) {
            for (const m of r.body.matchAll(/font-family:\s*([^;]+)/g)) assert.ok(/^'GNF'/.test(m[1].trim()), `${r.sel} font-family is GNF, not ${m[1].trim()}`);
            for (const m of r.body.matchAll(/font-size:\s*([^;]+)/g)) assert.ok(m[1].trim() === '16px', `${r.sel} font-size is 16px, not ${m[1].trim()}`);
            for (const m of r.body.matchAll(/letter-spacing:\s*([^;]+)/g)) assert.ok(/^(0|\d+px)$/.test(m[1].trim()), `${r.sel} letter-spacing is 0 or whole px, not ${m[1].trim()}`);
        }
    }
    const tab = body(f, '.fdp-tab');
    assert.ok(/min-height:\s*(3[6-9]|[4-9]\d)px/.test(tab), 'tab hit height is 36px or more');
    assert.ok(/white-space:\s*nowrap/.test(tab), 'tab wrap unchanged');
    assert.ok(/\.minigame-container button[^{}]*\{[^{}]*font-family:\s*'GNF'/.test(read('minigames-framework.css')), 'framework still gives buttons GNF');
});

test('music widget select and mail selects draw in GNF (pixel face)', () => {
    assert.ok(/font-family:\s*'GNF'/.test(body('music-widget.css', '.mw-select')), 'mw-select GNF');
    const fonts = read('fonts.css');
    assert.ok(/--se-font-readable:\s*var\(--se-font-pixel\)/.test(fonts), 'readable face is the pixel face');
    assert.ok(/--se-font-pixel:\s*'GNF'/.test(fonts), 'pixel face is GNF');
    const mail = read('mail-client-minigame.css');
    assert.ok(!/Pixelify/.test(mail), 'mail sheet names no Pixelify Sans');
    for (const sel of ['.mail-composer select', '.mail-account-select,\n.mail-compose-sendas-select']) {
        const re = /([^{}]+)\{([^{}]*)\}/g;
        let m, found = false;
        while ((m = re.exec(mail))) if (m[1].trim() === sel && /font-family/.test(m[2])) {
            found = true;
            assert.ok(/font-family:\s*var\(--se-font-readable\)/.test(m[2]), `${sel} uses the pixel var`);
        }
        assert.ok(found, `${sel} sets a font-family`);
    }
});
