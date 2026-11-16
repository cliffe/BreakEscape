// The shared device frame (patch-panel and rogue-ap, PHYSICAL_PENTEST_DEVICES_PLAN 4.4 / 5.4):
// theme-independent, a 16 CSS px edge per side (2px border + 14px pad) so the B3 9-slice can
// replace it without moving the layout, pixel rules (no radius, no shadow), and loaded by the game page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const css = readFileSync(join(root, 'public/break_escape/css/device-frame.css'), 'utf8');
const rule = /\.device-frame\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';

test('the frame edge is 16px per side: a 2px border and a 14px pad', () => {
    assert.match(rule, /border:\s*2px solid/);
    assert.match(rule, /padding:\s*14px;/);
});

test('pixel rules: no radius, no shadow, and no theme variables', () => {
    assert.match(rule, /border-radius:\s*0;/);
    assert.match(rule, /box-shadow:\s*none;/);
    assert.doesNotMatch(css, /var\(--ui-/, 'the device frame must not follow the UI theme');
});

test('the title uses Press Start 2P at 16px, 8px below W 480', () => {
    assert.match(css, /\.device-frame-title\s*\{[^}]*font-family:\s*'Press Start 2P'[^}]*font-size:\s*16px/);
    assert.match(css, /@media \(max-width: 559px\)\s*\{[^@]*font-size:\s*8px/);
});

test('the game page loads the stylesheet', () => {
    const view = readFileSync(join(root, 'app/views/break_escape/games/show.html.erb'), 'utf8');
    assert.match(view, /\/break_escape\/css\/device-frame\.css/);
});
