// Minigame titles in pixel fonts must render without colour fringes (review finding B3.1 R1 m7).
// `font-smooth: never` and `-webkit-font-smoothing: none` do nothing on Chrome for Linux and Windows,
// so the fix is a compositing hint on the title elements (greyscale antialiasing instead of LCD).
// Live proof: before 586/514/472 fringe pixels per title, after 0 (tools: headless Chromium, 3 sizes).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const css = readFileSync(join(root, 'public/break_escape/css/minigames-framework.css'), 'utf8');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...strip(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));
const rule = rules.find((r) => /\[class\*="-title"\]/.test(r.sel) && /will-change:\s*transform/.test(r.body));

test('a title rule promotes minigame titles to their own layer (greyscale antialiasing)', () => {
    assert.ok(rule, 'a rule on [class*="-title"] sets will-change: transform');
    assert.match(rule.sel, /^\.minigame-container\b/, 'scoped to the minigame container');
    assert.match(rule.sel, /\.minigame-header h3/, 'covers the framework header title too');
});

test('the rule is on the titles, not the container (a transformed container captures position:fixed popups)', () => {
    const container = rules.find((r) => r.sel === '.minigame-container');
    assert.ok(container);
    assert.doesNotMatch(container.body, /will-change|transform/);
});

test('the rule adds no transform, zoom, filter, radius or non-pixel font to titles', () => {
    assert.doesNotMatch(rule.body, /(^|[;\s])(transform|zoom|filter|border-radius|font-family)\s*:/);
});

test('the covered title classes are the ones the device frame and other minigames use', () => {
    for (const cls of ['device-frame-title', 'pin-minigame-title', 'notes-minigame-title']) {
        assert.ok(/-title$/.test(cls) && /\[class\*="-title"\]/.test(rule.sel), `${cls} matches [class*="-title"]`);
    }
    const dev = readFileSync(join(root, 'public/break_escape/css/device-frame.css'), 'utf8');
    assert.match(dev, /\.device-frame-title\b/);
    assert.match(dev, /font-size:\s*16px/);
});

test('the title font sizes stay on whole pixels in the device frame (8 or 16px)', () => {
    const dev = strip(readFileSync(join(root, 'public/break_escape/css/device-frame.css'), 'utf8'));
    const t = [...dev.matchAll(/\.device-frame-title\s*\{([^}]*)\}/g)].map((m) => /font-size:\s*(\d+)px/.exec(m[1])?.[1]);
    assert.deepEqual(t.sort(), ['16', '8']);
});
