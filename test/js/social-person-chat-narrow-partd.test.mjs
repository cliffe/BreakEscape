// UI SE fix round 2 part D: C-PC2 - person-chat no longer leaves a tall black gap under the
// dialogue on a narrow phone. The portrait grows to fill and the dialogue band hugs the foot.
// Run with: node --test test/js/social-person-chat-narrow-partd.test.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '../../public/break_escape/css/person-chat-minigame.css'), 'utf8');

// Isolate the narrow (max-width: 600px) block.
const m = css.match(/@media \(max-width: 600px\) \{([\s\S]*?)\n\}/);
assert.ok(m, 'the narrow media query exists');
const narrow = m[1];

test('C-PC2: at narrow width the portrait grows to fill (no black gap) but never below --pc-portrait-h', () => {
    const portrait = narrow.match(/\.person-chat-portrait-section \{([^}]*)\}/);
    assert.ok(portrait, 'the narrow portrait rule exists');
    assert.match(portrait[1], /flex:\s*1 1 auto/, 'the portrait grows to fill the spare height');
    assert.match(portrait[1], /min-height:\s*var\(--pc-portrait-h/, 'with the viewport-sized height as its floor');
    assert.doesNotMatch(portrait[1], /aspect-ratio:\s*4 \/ 3/, 'no fixed 4:3 strip that left a black gap');
    assert.doesNotMatch(portrait[1], /flex:\s*0 0 var\(--pc-portrait-h/, 'not a fixed-height section that leaves black under the dialogue');
});

test('C-PC2: the canvas fills the grown section, so spare height is room and not black', () => {
    const canvasRule = css.match(/\.person-chat-portrait-canvas-container canvas \{([^}]*)\}/);
    assert.ok(canvasRule, 'the canvas rule exists');
    assert.match(canvasRule[1], /width:\s*100%/);
    assert.match(canvasRule[1], /height:\s*100%/);
    assert.doesNotMatch(narrow, /canvas\s*\{[^}]*(width|height):\s*\d+px/, 'the narrow block does not pin the canvas to a pixel size');
});

test('C-PC2: the dialogue band hugs its content at the foot, scrolls, and leaves the portrait its height', () => {
    const caption = narrow.match(/\.person-chat-caption-area \{([^}]*)\}/);
    assert.ok(caption, 'the narrow caption rule exists');
    assert.match(caption[1], /flex:\s*0 1 auto/, 'the band hugs its content rather than filling with black');
    assert.match(caption[1], /max-height:\s*calc\(100% - var\(--pc-portrait-h/, 'its cap is what leaves the portrait its height');
    assert.doesNotMatch(caption[1], /max-height:\s*60%/, 'the old 60% cap is gone');
    assert.match(caption[1], /overflow-y:\s*auto/, 'and scrolls');
});
