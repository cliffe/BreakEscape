// The lockpicking item strip wraps its content (no fixed height, no empty band under the
// heading) and its h4 is legible at every width (Press Start 2P at 12px or more).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape');
const css = readFileSync(join(root, 'css/lockpicking.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const js = readFileSync(join(root, 'js/minigames/lockpicking/lockpicking-game-phaser.js'), 'utf8');

// Every declaration block whose selector list includes `selector`, at any @media depth
function blocks(selector) {
    const out = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(css))) {
        const sels = m[1].split(',').map(s => s.trim().replace(/@media[^{]*$/, '').trim().replace(/\s+/g, ' '));
        if (sels.includes(selector)) out.push(m[2]);
    }
    return out;
}

test('info strip and info block have no fixed height', () => {
    for (const sel of ['.lockpicking-item-section', '.lockpicking-item-info']) {
        for (const body of blocks(sel)) {
            assert.doesNotMatch(body, /(^|;|\s)(min-)?height\s*:/, `${sel} must not set a height`);
        }
    }
});

test('every h4 rule in the info block is 12px or larger', () => {
    const rs = blocks('.lockpicking-item-info h4');
    assert.ok(rs.length >= 3);
    for (const body of rs) {
        const m = body.match(/font-size\s*:\s*(\d+)px/);
        if (m) assert.ok(Number(m[1]) >= 12, `h4 font-size ${m[1]}px`);
    }
});

test('empty observations leave no empty paragraph or heading gap', () => {
    assert.ok(blocks('.lockpicking-item-info p:empty').some(b => /display\s*:\s*none/.test(b)));
    assert.ok(blocks('.lockpicking-item-info h4:last-child').some(b => /margin-bottom\s*:\s*0/.test(b)));
    assert.match(js, /\$\{itemObservations \? `<p>/);
});
