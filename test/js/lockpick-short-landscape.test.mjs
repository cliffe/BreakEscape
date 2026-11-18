// Short landscape windows (667x375, 740x360, 844x390): the lock is usable without scrolling.
// The info strip is one compact row, the mode switch an icon button with a name, the lock's
// frame takes the rest of the window and the canvas scales to it. Taller windows are untouched.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape');
const css = readFileSync(join(root, 'css/lockpicking.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const js = readFileSync(join(root, 'js/minigames/lockpicking/lockpicking-game-phaser.js'), 'utf8');
const tm = readFileSync(join(root, 'js/minigames/lockpicking/tool-manager.js'), 'utf8');

// The last top-level @media block whose condition is exactly `max-height: 560px`
const mediaBlocks = [];
{
    const re = /@media\s*([^{]*)\{/g;
    let m;
    while ((m = re.exec(css))) {
        let depth = 1, i = re.lastIndex;
        while (depth && i < css.length) { depth += css[i] === '{' ? 1 : css[i] === '}' ? -1 : 0; i++; }
        mediaBlocks.push({ cond: m[1].trim(), body: css.slice(re.lastIndex, i - 1) });
    }
}
const short = mediaBlocks.filter((b) => b.cond === '(max-height: 560px)').pop();

function rule(body, selector) {
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(body))) {
        const sels = m[1].split(',').map((s) => s.trim().replace(/\s+/g, ' '));
        if (sels.includes(selector)) return m[2];
    }
    return null;
}

test('the short-window block is scoped to height only and is the last rule set in the file', () => {
    assert.ok(short, 'a (max-height: 560px) block');
    assert.doesNotMatch(short.cond, /width|min-height|orientation/);
    assert.equal(mediaBlocks[mediaBlocks.length - 1], short, 'last, so it wins');
});

test('the info strip is one nowrap row, 48px picture, clear of the X', () => {
    const strip = rule(short.body, '.lockpicking-item-section');
    assert.match(strip, /flex-direction\s*:\s*row/);
    assert.match(strip, /flex-wrap\s*:\s*nowrap/);
    assert.match(strip, /padding\s*:[^;]*52px/, 'right padding clears the fixed X');
    assert.match(rule(short.body, '.lockpicking-item-image'), /height\s*:\s*48px/);
});

test('text stays on its pixel-font grid, one line of observations, no radius or gradient', () => {
    const h4 = rule(short.body, '.lockpicking-item-info h4');
    assert.match(h4, /font-size\s*:\s*16px/);
    assert.match(h4, /line-height\s*:\s*24px/);
    assert.match(rule(short.body, '.lockpicking-item-info p'), /font-size\s*:\s*20px/);
    assert.doesNotMatch(short.body, /border-radius\s*:\s*[1-9]|gradient|blur|font-size\s*:\s*(1[0-5]|[0-9])px/);
});

test('the mode switch is an icon at its own 32px, 48px target, the caption and label hidden', () => {
    assert.match(rule(short.body, '.lockpicking-mode-row .minigame-button'), /min-width\s*:\s*48px/);
    assert.match(rule(short.body, '.lockpicking-mode-row .minigame-button .icon-large'), /width\s*:\s*32px/);
    const hidden = rule(short.body, '.lockpicking-mode-row .lockpicking-mode-label');
    assert.match(hidden, /display\s*:\s*none/);
    assert.match(rule(short.body, '.lockpicking-mode-row .lockpicking-or-caption'), /display\s*:\s*none/);
});

test('the mode buttons keep a name: label span, aria-label and title, restored after disabling', () => {
    assert.match(tm, /class="lockpicking-mode-label">Switch to Lockpicking</);
    assert.match(tm, /class="lockpicking-mode-label">Switch to Key Mode</);
    assert.match(tm, /setAttribute\('aria-label', label\)/);
    assert.match(tm, /else if \(btn\.modeLabel\) \{\s*btn\.title = btn\.modeLabel/);
});

test('the lock frame is a flex share of the window and the canvas box fills it', () => {
    const frame = rule(short.body, '.minigame-game-container:has(> #phaser-game-container)');
    assert.match(frame, /flex\s*:\s*1 1 0/);
    assert.match(frame, /min-height\s*:\s*0/);
    assert.match(frame, /display\s*:\s*flex/);
    assert.match(frame, /flex-direction\s*:\s*column/);
    const box = rule(short.body, '.minigame-game-container:has(> #phaser-game-container) > #phaser-game-container');
    assert.match(box, /flex\s*:\s*1 1 0/);
    assert.match(box, /min-height\s*:\s*0/);
    assert.match(box, /aspect-ratio\s*:\s*auto/);
    assert.match(box, /overflow\s*:\s*hidden/);
});

test('the feedback line is in the frame and keeps its space when empty', () => {
    const fb = rule(short.body, '.minigame-game-container:has(> #phaser-game-container) > .lockpick-feedback');
    assert.match(fb, /min-height\s*:\s*32px/);
    assert.match(rule(short.body, '.minigame-game-container:has(> #phaser-game-container) > .lockpick-feedback:empty'), /visibility\s*:\s*hidden/);
});

test('taller windows are untouched: no 561px+ rule mentions the new row layout', () => {
    for (const b of mediaBlocks.filter((x) => /min-height:\s*561px/.test(x.cond) || /min-width:\s*769px\)\s*$/.test(x.cond))) {
        assert.doesNotMatch(b.body, /lockpicking-mode-label|nowrap;[\s\S]*48px/);
    }
});

test('the JS scales the cropped canvas with Scale.FIT in any short window, and skips whole zoom there', () => {
    assert.match(js, /window\.innerWidth <= 768 \|\| window\.innerHeight <= 560\) \{\s*const isPortrait/);
    assert.equal((js.match(/window\.innerHeight <= 560/g) || []).length, 3, 'config, _fitLockZoom, _watchLockZoom');
    assert.match(js, /mode: Phaser\.Scale\.FIT/);
});
