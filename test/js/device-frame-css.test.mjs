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

test('the title is 16px and wraps at every width, never ellipsis (K3 B, AC1 live fix)', () => {
    assert.match(css, /\.device-frame-title\s*\{[^}]*font-family:\s*'Press Start 2P'[^}]*font-size:\s*16px/);
    // Wrapping must sit outside any media query, so it applies at 844x390 and 1280x720 too.
    const phone = /@media \(max-width: 559px\)\s*\{([^@]*)\}\s*$/.exec(css.trim())?.[1] ?? '';
    const base = phone ? css.replace(phone, '') : css;
    assert.ok(!/white-space|text-overflow|overflow-wrap/.test(phone), 'the 559px block holds no wrap rule');
    assert.ok(!/font-size/.test(phone), 'no phone font-size override: the title stays 16px');
    const textRule = /([^{}]*)\{([^}]*white-space:\s*normal[^}]*)\}/.exec(base);
    const sels = textRule ? textRule[1] : '';
    const body = textRule ? textRule[2] : '';
    assert.ok(/\.device-frame > \.device-frame-title > span/.test(sels), 'span selector shares the wrap rule');
    assert.ok(/\.device-frame > \.device-frame-title > h2/.test(sels), 'h2 selector shares the wrap rule');
    assert.ok(/text-overflow:\s*clip/.test(body), 'ellipsis is overridden');
    assert.ok(/overflow:\s*visible/.test(body), 'overflow is visible');
    assert.ok(/min-width:\s*0/.test(body), 'min-width 0 on the text');
    assert.ok(/overflow-wrap:\s*anywhere/.test(body), 'text breaks anywhere');
    assert.ok(/\.device-frame > \.device-frame-title\s*\{[^}]*overflow-wrap:\s*anywhere/.test(base), 'the row breaks anywhere too');
    // Specificity (0,2,1) beats the two-class (0,2,0) title rules in vm-launcher and rogue-ap.
    const sheet = (f) => readFileSync(join(root, 'public/break_escape/css', f), 'utf8');
    assert.ok(/\.vm-launcher-frame \.vm-launcher-title\s*\{[^}]*nowrap/.test(sheet('vm-launcher-minigame.css')), 'vm-launcher title is (0,2,0)');
    assert.ok(/\.rogue-ap \.rogue-ap-title-text\s*\{[^}]*nowrap/.test(sheet('rogue-ap.css')), 'rogue-ap title text is (0,2,0)');
    // The row must not set min-width: it would tie the patch panel's min-width: 100% at (0,2,0).
    const row = /\.device-frame > \.device-frame-title\s*\{([^}]*)\}/.exec(base)?.[1] ?? '';
    assert.ok(!/min-width/.test(row), 'no min-width on the title row');
    assert.ok(/padding-right:\s*(1[4-9]|[2-9]\d)px/.test(body), 'text keeps 14px+ clear on the right at every width');
});

test('the game page loads the stylesheet', () => {
    const view = readFileSync(join(root, 'app/views/break_escape/games/show.html.erb'), 'utf8');
    assert.match(view, /\/break_escape\/css\/device-frame\.css/);
});
