// The shared device frame (patch-panel and rogue-ap, PHYSICAL_PENTEST_DEVICES_PLAN 4.4 / 5.4):
// theme-independent, a 16 CSS px edge per side (the hand-drawn 9-slice, slice 8 at 2x), pixel rules (no radius, no shadow), and loaded by the game page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const css = readFileSync(join(root, 'public/break_escape/css/device-frame.css'), 'utf8');
const rule = /\.device-frame\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';

test('the frame edge is 16px per side: a 16px border with the 9-slice (slice 8, 16px, stretch), no padding', () => {
    assert.match(rule, /border:\s*16px solid/);
    assert.match(rule, /padding:\s*0;/);
    assert.match(rule, /border:\s*16px solid transparent/, 'fallback border is transparent');
    assert.match(rule, /--device-frame-gap:\s*6px/);
    assert.match(rule, /border-image:\s*var\(--device-frame-art\) 8 fill \/ 16px \/ 0 stretch;/);
    assert.match(rule, /max-width:\s*calc\(100vw - 32px\)/);
    assert.match(rule, /max-height:\s*calc\(100dvh - 32px\)/);
    assert.match(rule, /image-rendering:\s*pixelated/);
});

test('the art is frame B (one line to swap to A) and both native 24x24 PNGs ship', () => {
    assert.match(css, /--device-frame-art:\s*url\('\/break_escape\/assets\/ui\/devices\/device_frame_b\.png'\)/);
    for (const f of ['device_frame_a.png', 'device_frame_b.png']) {
        const png = readFileSync(join(root, 'public/break_escape/assets/ui/devices', f));
        assert.equal(png.readUInt32BE(16), 24, `${f} width`);
        assert.equal(png.readUInt32BE(20), 24, `${f} height`);
    }
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
