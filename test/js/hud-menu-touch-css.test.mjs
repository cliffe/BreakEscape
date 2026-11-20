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

// Every touch media block in the file (a later block must not hide the one with our rules).
function touchBlocks(file) {
    const src = strip(readFileSync(join(cssDir, file), 'utf8'));
    const out = [];
    for (let at = src.indexOf(MQ); at >= 0; at = src.indexOf(MQ, at + 1)) {
        let i = src.indexOf('{', at), depth = 0, j = i;
        for (; j < src.length; j++) {
            if (src[j] === '{') depth++;
            else if (src[j] === '}' && --depth === 0) break;
        }
        out.push(src.slice(i + 1, j));
    }
    assert.ok(out.length > 0, `${file} has the touch media query`);
    return out;
}
const touchBlock = (file) => touchBlocks(file).join('\n');
const rule = (block, sel) => {
    const m = [...block.matchAll(/([^{}]+)\{([^{}]*)\}/g)].findLast((r) => r[1].trim() === sel); // last wins the cascade
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

test('webkit thumb is centred on the 6px content box of the track', () => {
    const r = rule(touchBlock('music-widget.css'), '.mw-vol-slider::-webkit-slider-thumb');
    assert.ok(/margin-top:\s*-11px/.test(r), '(6 - 28) / 2 = -11px');
});

test('touch: floating panel scrolls inside the viewport; the menu page resets it', () => {
    const r = rule(touchBlock('music-widget.css'), '#music-widget-panel');
    const caps = [...r.matchAll(/max-height:\s*([^;]+);/g)].map((m) => m[1]);
    assert.ok(caps.length === 2 && /100vh/.test(caps[0]) && /100dvh/.test(caps[1]), 'vh fallback then dvh line last');
    for (const c of caps) {
        assert.ok(/\/ var\(--hud-zoom, 1\)/.test(c), 'viewport divided by the HUD zoom');
        assert.ok(/2 \* var\(--ui-frame-px/.test(c), 'counts the frame on both sides');
    }
    // Work it out for the widest themed frame, zoom 1: top 82 + 2 frames + content cap must fit
    const themes = readFileSync(join(cssDir, 'ui-themes.css'), 'utf8');
    const frames = [...themes.matchAll(/--ui-frame-px:\s*(\d+)px/g)].map((m) => +m[1]);
    const widest = Math.max(...frames);
    assert.ok(widest === 28, 'widest frame is 28px (update if themes change)');
    // Pin the exact caps, then do the sum with the reserve and frame count read from the CSS
    assert.ok(caps[0] === 'calc(100vh / var(--hud-zoom, 1) - 90px - 2 * var(--ui-frame-px, 2px))', 'vh cap: ' + caps[0]);
    assert.ok(caps[1] === 'calc(100dvh / var(--hud-zoom, 1) - 90px - 2 * var(--ui-frame-px, 2px))', 'dvh cap: ' + caps[1]);
    for (const c of caps) {
        const m = c.match(/- (\d+)px - (\d+) \* var\(--ui-frame-px/);
        assert.ok(m, 'cap subtracts a px reserve and N frames: ' + c);
        const reserve = +m[1], n = +m[2];
        assert.ok(reserve >= 82, 'reserve covers the 82px top offset');
        for (const H of [390, 360]) {
            assert.ok(82 + 2 * widest + (H - reserve - n * widest) <= H, `panel ends inside a ${H}px viewport`);
        }
    }
    assert.ok(/overflow-y:\s*auto/.test(r), 'scrolls');
    const g = strip(readFileSync(join(cssDir, 'game-menu.css'), 'utf8'));
    const m = [...g.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find((x) => x[1].trim() === '[data-ui-theme] .game-menu-page #music-widget-panel,\n.game-menu-page #music-widget-panel');
    assert.ok(m, 'menu page panel rule');
    assert.ok(/max-height:\s*none/.test(m[2]) && /overflow:\s*visible/.test(m[2]), 'menu page uses its own scroller');
});

test('active menu tab cue is a 4px accent ::after drawn above the border image', () => {
    const src = strip(readFileSync(join(cssDir, 'ui-themes.css'), 'utf8'));
    const rules = [...src.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
    const host = rules.find((r) => r[1].trim() === '[data-ui-theme] .game-menu-item.active');
    assert.ok(host && /position:\s*relative/.test(host[2]), 'tab is a positioned host');
    const bar = rules.find((r) => r[1].trim() === '[data-ui-theme] .game-menu-item.active::after');
    assert.ok(bar, 'pseudo-element rule');
    assert.ok(/position:\s*absolute/.test(bar[2]) && /bottom:\s*0/.test(bar[2]), 'at the bottom edge');
    assert.ok(/height:\s*4px/.test(bar[2]), '4px');
    assert.ok(/background:\s*var\(--ui-accent\)/.test(bar[2]), 'accent fill');
    assert.ok(/z-index:\s*1/.test(bar[2]), 'z-order above the border image');
    assert.ok(!/box-shadow:\s*inset 0 -4px/.test(src), 'no inset shadow (the 9-slice fill covers it)');
    const themes = (src.match(/\[data-ui-theme="[a-z]+"\]\s*\{[^{}]*--ui-accent:/g) || []).length;
    assert.ok(themes === 7, 'all 7 themes define --ui-accent');
});

test('rule finder takes the last matching rule (a later bad override cannot hide)', () => {
    const b = '.a { x: 1; } .a { x: 2; }';
    assert.ok(/x:\s*2/.test(rule(b, '.a')), 'last rule wins');
});
