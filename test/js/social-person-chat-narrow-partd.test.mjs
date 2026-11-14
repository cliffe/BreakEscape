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

test('C-PC2: at narrow width the portrait grows to fill and does not pin to a 4:3 strip', () => {
    const portrait = narrow.match(/\.person-chat-portrait-section \{([^}]*)\}/);
    assert.ok(portrait, 'the narrow portrait rule exists');
    assert.match(portrait[1], /flex:\s*1 1 auto/, 'the portrait grows to fill the spare height');
    assert.doesNotMatch(portrait[1], /aspect-ratio:\s*4 \/ 3/, 'no fixed 4:3 strip that left a black gap');
});

test('C-PC2: the dialogue band hugs its content at the foot, capped and scrollable', () => {
    const caption = narrow.match(/\.person-chat-caption-area \{([^}]*)\}/);
    assert.ok(caption, 'the narrow caption rule exists');
    assert.match(caption[1], /flex:\s*0 1 auto/, 'the band hugs its content rather than filling with black');
    assert.match(caption[1], /max-height:\s*60%/, 'a long line is capped');
    assert.match(caption[1], /overflow-y:\s*auto/, 'and scrolls');
    assert.match(narrow, /object-fit:\s*cover/, 'the grown portrait fills (cover) instead of letterboxing');
});
