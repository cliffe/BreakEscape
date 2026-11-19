// Post-release UI rule polish (fix/ui-rule-polish): CSS-source pins so each fix fails on regression.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

test('triage jump select has a 2px border and stays border-box full width', () => {
    const b = body('inbox-triage-minigame.css', '.tri-jump-select');
    assert.ok(b !== null, 'rule exists');
    assert.ok(/border:\s*2px solid/.test(b), 'border is 2px');
    assert.ok(!/border:\s*1px/.test(b), 'no 1px border');
    assert.ok(/box-sizing:\s*border-box/.test(b) && /width:\s*100%/.test(b), 'layout unchanged');
});

test('password modal input is GNF at 24px on the grid, zoom-compensated', () => {
    const b = body('modals.css', '#password-modal-input');
    assert.ok(b !== null, 'rule exists');
    assert.ok(/font-family:\s*'GNF'/.test(b), 'GNF');
    assert.ok(/font-size:\s*max\(24px, calc\(24px \/ var\(--hud-zoom, 1\)\)\)/.test(b), 'font-size is 24px, compensated');
    assert.ok(!/20px/.test(b), 'no 20px left');
});

test('forensic data platform GNF controls sit on the 16px grid', () => {
    for (const sel of ['.fdp-tab', '.fdp-confirm-btn']) {
        const b = body('forensic-data-platform-minigame.css', sel);
        assert.ok(b !== null, `${sel} rule exists`);
        assert.ok(/font-size:\s*16px/.test(b), `${sel} is 16px`);
    }
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
