// Minigame titles in pixel fonts must render without colour fringes (review finding B3.1 R1 m7).
// `font-smooth: never` and `-webkit-font-smoothing: none` do nothing on Chrome for Linux and Windows,
// so the fix is a compositing hint on the title elements (greyscale antialiasing instead of LCD).
// The rule uses an explicit class list: a `[class*="-title"]` match also caught wrapper bars that hold
// the close button (.console-titlebar), icons and non-pixel-font titles (crisp-titles review R1 M1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const css = readFileSync(join(root, 'public/break_escape/css/minigames-framework.css'), 'utf8');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...strip(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));
// The titles rule is the one that names .patch-panel-title (the body-text rule is tested in minigame-text-crisp-css.test.mjs).
const rule = rules.find((r) => /will-change:\s*transform/.test(r.body) && /\.patch-panel-title\b/.test(r.sel));

// The selector list inside `.minigame-container :is( ... )`, split on commas.
const inner = rule && /^\.minigame-container\s+:is\(([\s\S]*)\)$/.exec(rule.sel);
const parts = inner ? inner[1].split(',').map((x) => x.trim()).filter(Boolean) : [];
// A part matches an element when it is a single class (the leaf title); a compound part such as
// `.minigame-header h3` matches by tag within a header.
const matchesClass = (cls) => parts.some((p) => p === `.${cls}`);
const matchesHeaderH3 = () => parts.includes('.minigame-header h3');
const matchesHeading = (sel) => parts.includes(sel);

test('a title rule promotes minigame titles to their own layer (greyscale antialiasing)', () => {
    assert.ok(rule, 'a will-change: transform rule on minigame titles exists');
    assert.ok(inner, 'scoped to the minigame container with :is(list)');
    assert.ok(parts.length >= 10, 'the list names the titles');
    assert.ok(matchesHeaderH3(), 'covers the framework header title too');
});

test('every entry is an exact class (no substring or attribute match)', () => {
    for (const p of parts) {
        assert.ok(/^\.[\w-]+$/.test(p) || /^\.[\w-]+ h[1-6]$/.test(p), `entry ${p} is a plain class, or one class followed by a heading tag`);
    }
    assert.doesNotMatch(rule.sel, /\[class/);
});

test('the pixel-font leaf titles are covered', () => {
    for (const cls of ['console-title', 'pin-minigame-title', 'notes-minigame-title',
        'patch-panel-title', 'rogue-ap-title-text', 'signin-title', 'desktop-window-title', 'share-folder-path']) {
        assert.ok(matchesClass(cls), `${cls} is listed`);
    }
});

test('the measured headings are covered (fringes without the rule, clean with it)', () => {
    for (const cls of ['rogue-ap-heading', 'fpr-heading', 'ib-h', 'bce-mx-heading', 'wcc-row-title']) {
        assert.ok(matchesClass(cls), `${cls} is listed`);
    }
    for (const sel of ['.combination-header h2', '.cryptex-header h2', '.dusting-panel h3', '.esd-confirm-card h3']) {
        assert.ok(matchesHeading(sel), `${sel} is listed`);
    }
});

test('wrapper bars, icons and non-pixel titles are not covered', () => {
    for (const cls of ['console-titlebar', 'console-titles', 'console-title-org', 'desktop-window-titlebar',
        'share-folder-titlebar', 'network-view-title-icon', 'bv-title-block', 'ob-page-title',
        'ob-site-title', 'ac-title', 'ncsc-brief-title', 'minigame-container', 'device-frame',
        'device-frame-title', 'console-window', 'share-folder-window', 'desktop-transfer-dialog']) {
        assert.ok(!matchesClass(cls), `${cls} is not listed`);
        assert.ok(!parts.some((p) => p.startsWith(`.${cls} `)), `${cls} is not listed with a heading tag`);
    }
});

// A listed class that nothing emits is a dead entry that reads as coverage (crisp-titles review R2 m1).
// Looks the class up as a token in the engine JS and the views. This does not look for titles that are
// missing from the list: a new pixel-font title is added by hand after a fringe check.
const walk = (dir) => readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
});
const sources = [...walk(join(root, 'public/break_escape/js')), ...walk(join(root, 'app/views'))]
    .filter((f) => /\.(js|mjs|erb)$/.test(f))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');

test('every listed class is emitted by the engine JS or a view', () => {
    for (const p of parts) {
        const cls = /^\.([\w-]+)/.exec(p)[1];
        assert.ok(new RegExp(`(^|[^\\w-])${cls}([^\\w-]|$)`).test(sources), `${cls} appears in public/break_escape/js or app/views`);
    }
});

test('the rule is on the titles, not the container (a transformed container captures position:fixed popups)', () => {
    const container = rules.find((r) => r.sel === '.minigame-container');
    assert.ok(container);
    assert.doesNotMatch(container.body, /will-change|transform/);
});

test('the rule adds no transform, zoom, filter, radius or non-pixel font to titles', () => {
    assert.doesNotMatch(rule.body, /(^|[;\s])(transform|zoom|filter|border-radius|font-family)\s*:/);
});

test('the device frame title keeps whole pixel font sizes', () => {
    const dev = strip(readFileSync(join(root, 'public/break_escape/css/device-frame.css'), 'utf8'));
    const sizes = [...dev.matchAll(/\.device-frame-title\s*\{([^}]*)\}/g)].map((m) => /font-size:\s*([\d.]+)px/.exec(m[1])?.[1]).filter(Boolean);
    assert.ok(sizes.length >= 1);
    for (const s of sizes) assert.match(s, /^\d+$/, `font size ${s}px is whole`);
});
