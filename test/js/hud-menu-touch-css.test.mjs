// HUD menu on touch: volume sliders reach a 44px hit box (track drawn on the pseudo-elements,
// 20x28 thumb) and the active menu tab has a cue besides colour.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cssDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public/break_escape/css');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const MQ = '@media (max-width: 600px), (pointer: coarse)';

// The body of the touch media block, with nested braces balanced.
function touchBlock(file) {
    const src = strip(readFileSync(join(cssDir, file), 'utf8'));
    const at = src.indexOf(MQ);
    assert.ok(at >= 0, `${file} has the touch media query`);
    let i = src.indexOf('{', at), depth = 0, j = i;
    for (; j < src.length; j++) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}' && --depth === 0) break;
    }
    return src.slice(i + 1, j);
}
const rule = (block, sel) => {
    const m = [...block.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find((r) => r[1].trim() === sel);
    assert.ok(m, `rule ${sel}`);
    return m[2];
};

test('touch: slider rows, slider element, track and thumb sizes', () => {
    const b = touchBlock('music-widget.css');
    assert.ok(/min-height:\s*44px/.test(rule(b, '.mw-vol-row')), 'row min-height 44px');
    const s = rule(b, '.mw-vol-slider');
    assert.ok(/height:\s*44px/.test(s), 'slider 44px tall');
    assert.ok(/background:\s*transparent/.test(s), 'slider transparent');
    assert.ok(/border:\s*0/.test(s), 'slider no border');
    for (const t of ['.mw-vol-slider::-webkit-slider-runnable-track', '.mw-vol-slider::-moz-range-track']) {
        const r = rule(b, t);
        assert.ok(/height:\s*6px/.test(r), `${t} 6px`);
        assert.ok(/border:\s*2px solid #444/.test(r), `${t} 2px border`);
    }
    for (const t of ['.mw-vol-slider::-webkit-slider-thumb', '.mw-vol-slider::-moz-range-thumb']) {
        const r = rule(b, t);
        assert.ok(/width:\s*20px/.test(r) && /height:\s*28px/.test(r), `${t} 20x28`);
        assert.ok(/border-radius:\s*0/.test(r), `${t} no radius`);
    }
});

test('touch: themed slider fill moves to the track', () => {
    const b = touchBlock('ui-themes.css');
    assert.ok(/background:\s*transparent/.test(rule(b, '[data-ui-theme] #music-widget-panel .mw-vol-slider')), 'themed slider transparent');
    for (const t of ['::-webkit-slider-runnable-track', '::-moz-range-track']) {
        assert.ok(/--ui-surface-raised/.test(rule(b, `[data-ui-theme] #music-widget-panel .mw-vol-slider${t}`)), `themed ${t}`);
    }
});

test('active menu tab has a raised fill and a 4px bar, kept on hover and press', () => {
    const src = strip(readFileSync(join(cssDir, 'ui-themes.css'), 'utf8'));
    const m = [...src.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find((r) => r[1].includes('.game-menu-item.active:hover'));
    assert.ok(m, 'active tab rule');
    assert.ok(m[1].includes('.game-menu-item.active:active'), 'covers :active');
    assert.ok(/background:\s*var\(--ui-surface-raised\)/.test(m[2]), 'raised background');
    assert.ok(/box-shadow:\s*inset 0 -4px 0 var\(--ui-accent\)/.test(m[2]), '4px bottom bar, no blur');
});
