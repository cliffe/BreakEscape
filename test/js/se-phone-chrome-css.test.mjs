// B9: SE scenes on phones keep their 16px frame and 100dvh, mail-client keeps Close in the header
// row, shredded-document clears the X, and mail-client / inbox-triage follow the pixel rules.
// Run with: node --test test/js/se-phone-chrome-css.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const css = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/css');
const read = (f) => readFileSync(join(css, f), 'utf8');
const narrow = (f, sel) => {
    const m = read(f).match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}', 'g'));
    return (m || []).join('\n');
};

for (const [file, sel] of [
    ['engagement-report-minigame.css', '.engagement-report-game-container'],
    ['intel-board-minigame.css', '.intel-board-game-container'],
    ['osint-browser-minigame.css', '.osint-browser-game-container']]) {
    test(`${file} narrow rule keeps the 16px frame and 100dvh`, () => {
        const block = narrow(file, sel).split('\n').filter((l) => /100vw/.test(l) || /border-width/.test(l)).join('\n');
        const all = narrow(file, sel);
        assert.ok(/border-width:\s*16px/.test(all), 'border-width 16px');
        assert.ok(!/border-width:\s*(0|2px)\b/.test(all), 'no dropped frame');
        assert.ok(/height:\s*100dvh/.test(all), '100dvh');
        assert.ok(block.length > 0, 'narrow rule present');
    });
}

test('shredded-document instruction has right padding for the X', () => {
    const m = read('shredded-document-minigame.css').match(/\.sdm-instruction\s*\{([^}]*)\}/);
    assert.ok(m && /padding:\s*8px 48px 8px 14px/.test(m[1]), 'right padding 48px');
});

test('mail-client phone toolbar: Close in the header row, buttons on their own row', () => {
    const s = read('mail-client-minigame.css');
    assert.ok(/\.mail-client--phone \.mail-toolbar:not\(\.tri-toolbar\) \.se-overlay-close \{ order: 1; margin-left: auto; \}/.test(s), 'phone close order');
    assert.ok(/\.mail-client \.mail-toolbar:not\(\.tri-toolbar\) \.se-overlay-close \{ order: 1; margin-left: auto; \}/.test(s), 'narrow close order');
    assert.ok(/> \.mail-toolbar-actions \{ order: 2; \}/.test(s), 'actions on row two');
});

test('mail-client and inbox-triage have no radius or blurred shadow in the listed rules', () => {
    const mc = read('mail-client-minigame.css');
    assert.ok(!/border-radius:\s*(4|6|18|36)px/.test(mc), 'mail-client radius');
    assert.ok(!/0 12px 32px/.test(mc), 'phone blurred shadow');
    assert.ok(/box-shadow:\s*0 0 0 6px #0b0e18;/.test(mc), 'hard phone frame');
    const it = read('inbox-triage-minigame.css');
    assert.ok(!/border-radius:\s*(50%|999px)/.test(it), 'inbox-triage radius');
    assert.ok(!/border:\s*1px (solid|dashed) (var\(--ui-line|currentColor)/.test(it), 'inbox-triage 1px borders');
});
