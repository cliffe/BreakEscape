// The lockpicking item strip wraps its content (no fixed height, no empty band under the
// heading) and its h4 is legible at every width (Press Start 2P at 12px or more).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { dirname, join } from 'node:path';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const anything = () => new Proxy(function () {}, {
    get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : anything()),
    apply: () => anything(),
    construct: () => anything()
});
globalThis.AudioContext = window.AudioContext = function () { return anything(); };
globalThis.Audio = window.Audio = globalThis.AudioContext;

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape');
const { LockpickingMinigamePhaser } = await import(pathToFileURL(join(root, 'js/minigames/lockpicking/lockpicking-game-phaser.js')).href);
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

test('every h4 rule in the info block is 16px Press Start 2P on a 24px line', () => {
    const rs = blocks('.lockpicking-item-info h4');
    assert.ok(rs.length >= 3);
    for (const body of rs) {
        const m = body.match(/font-size\s*:\s*(\d+)px/);
        if (m) assert.ok(Number(m[1]) >= 16, `h4 font-size ${m[1]}px`);
    }
    assert.ok(rs.some((b) => /line-height\s*:\s*24px/.test(b)), 'a 24px line for the 16px heading');
});

test('empty observations leave no empty paragraph or heading gap', () => {
    assert.ok(blocks('.lockpicking-item-info p:empty').some(b => /display\s*:\s*none/.test(b)));
    assert.ok(blocks('.lockpicking-item-info h4:last-child').some(b => /margin-bottom\s*:\s*0/.test(b)));
    assert.match(js, /\$\{itemObservations \? `<p>/);
});

function render(observations) {
    document.body.innerHTML = '<div><div class="game"></div></div>';
    const fake = { params: { itemName: 'Server cage', itemImage: '/door.png', itemObservations: observations }, gameContainer: document.querySelector('.game') };
    LockpickingMinigamePhaser.prototype.createLockableItemDisplay.call(fake);
    return document.querySelector('.lockpicking-item-info');
}

test('render: no paragraph when observations are empty, one when present', () => {
    assert.equal(render('').querySelectorAll('p').length, 0);
    assert.equal(render('').querySelectorAll('h4').length, 1);
    assert.equal(render('A heavy cage door').querySelectorAll('p').length, 1);
});

test('the lock frame wraps its content on phones (auto height, scoped to the lock)', () => {
    // every block holding the lock-scoped frame rule must be narrow AND tall (R2 M1: in a short
    // window the frame has to shrink and scroll by itself, or the shell scrolls too)
    const blocks = [...css.matchAll(/@media([^{]*)\{((?:[^{}]*\{[^}]*\})*)\s*\}/g)]
        .filter((b) => /\.minigame-game-container:has\(> #phaser-game-container\)\s*\{[^}]*height:\s*auto/.test(b[2]));
    assert.equal(blocks.length, 1, 'exactly one lock-scoped game container rule');
    const anywhere = css.match(/\.minigame-game-container:has\(> #phaser-game-container\)\s*\{[^}]*(?:^|[\s;{])height:\s*auto/gm) || [];
    assert.equal(anywhere.length, 1, 'no second, unscoped auto-height copy of the rule');
    for (const b of blocks) {
        assert.doesNotMatch(b[1], /,/, 'no OR-list that re-enables it in short windows');
        assert.match(b[1], /max-width:\s*768px/);
        assert.match(b[1], /min-height:\s*561px/, 'not applied in short windows');
    }
    const m = blocks[0][2].match(/\.minigame-game-container:has\(> #phaser-game-container\)\s*\{([^}]*)\}/);
    assert.match(m[1], /height\s*:\s*auto/);
    assert.doesNotMatch(m[1], /height\s*:\s*100%/);
    const framework = readFileSync(join(root, 'css/minigames-framework.css'), 'utf8');
    assert.match(framework, /\.minigame-game-container \{[^}]*height:\s*100%/, 'the shared rule is untouched');
});

test('the portrait picture box follows the image shape', () => {
    const portrait = css.slice(css.indexOf('(orientation: portrait)'));
    const m = portrait.match(/\.lockpicking-item-image\s*\{([^}]*)\}/);
    assert.ok(m);
    assert.match(m[1], /width\s*:\s*auto/);
    assert.match(m[1], /min-width\s*:\s*0/);
});
