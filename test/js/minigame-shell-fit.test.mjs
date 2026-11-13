// The minigame shell fits the window (UI shell build, docs/achitechture/UI_SHELL_BUILD_LOG.md):
// the full-window .minigame-container is border-box, so a scene's border never makes it larger
// than the window; it centres with `safe center`, so a frame taller or wider than the window
// starts at the top-left edge instead of spilling past it; it scrolls with the pixel-art
// scrollbar; and the X inside a frame follows the shell's scroll. Also the lock and core
// scene fixes from critique A that are plain CSS or markup.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape');
const css = (name) => readFileSync(join(root, 'css', name), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const src = (rel) => readFileSync(join(root, 'js', rel), 'utf8');

// Declarations of every rule (at any nesting) whose selector list includes `selector`,
// optionally only inside an @media block whose condition contains `media`
function rules(text, selector, media = null) {
    const out = [];
    const walk = (block, cond) => {
        let i = 0;
        while (i < block.length) {
            const open = block.indexOf('{', i);
            if (open < 0) break;
            const head = block.slice(i, open).trim();
            // find the matching close brace
            let depth = 1, j = open + 1;
            while (j < block.length && depth) { if (block[j] === '{') depth++; else if (block[j] === '}') depth--; j++; }
            const body = block.slice(open + 1, j - 1);
            if (head.startsWith('@')) walk(body, head);
            else {
                const sels = head.split(',').map(s => s.trim().replace(/\s+/g, ' '));
                if (sels.includes(selector) && (media === null ? !cond || !cond.startsWith('@media') : (cond || '').includes(media))) {
                    const decls = {};
                    for (const d of body.split(';')) {
                        const k = d.indexOf(':');
                        if (k > 0) {
                            const name = d.slice(0, k).trim();
                            decls[name] = decls[name] ? [].concat(decls[name], d.slice(k + 1).trim()) : d.slice(k + 1).trim();
                        }
                    }
                    out.push(decls);
                }
            }
            i = j;
        }
    };
    walk(text, null);
    return out;
}
const rule = (text, selector, media = null) => {
    const all = rules(text, selector, media);
    assert.ok(all.length > 0, `no rule for ${selector}${media ? ` in ${media}` : ''}`);
    return Object.assign({}, ...all);
};
const has = (v, want) => [].concat(v || []).some(x => x.replace(/\s*!important/, '') === want);

const framework = css('minigames-framework.css');

test('the shell is border-box, centres safely and scrolls', () => {
    const r = rule(framework, '.minigame-container');
    assert.equal(r['box-sizing'], 'border-box', 'a scene border never makes the shell larger than the window (X1)');
    assert.ok(has(r['justify-content'], 'safe center'), 'a frame taller than the window starts at the top (X2)');
    assert.ok(has(r['align-items'], 'safe center'), 'and wider than the window starts at the left');
    assert.equal(r.overflow, 'auto', 'the shell scrolls rather than cutting content off');
    assert.ok(has(r.height, '100dvh'), 'the dynamic viewport height on phones');
    assert.equal(r.left, '0');
});

test('the game area is capped to the shell, so a frame scrolls inside rather than spills', () => {
    const r = rule(framework, '.minigame-container > .minigame-game-container');
    assert.equal(r['max-width'], '100%');
    assert.equal(r['max-height'], '100%');
    assert.equal(r['box-sizing'], 'border-box');
});

test('wrong-answer toasts sit at the top edge, clear of the controls in the middle (A10)', () => {
    for (const sel of ['.minigame-failure-message', '.minigame-success-message']) {
        const r = rule(framework, sel);
        assert.notEqual(r.top, '50%', `${sel} is not in the middle of the window`);
        assert.equal(r.transform, 'translateX(-50%)', sel);
    }
});

test('the shell and every game area carry the shared pixel-art scrollbar', () => {
    const base = src('minigames/framework/base-minigame.js');
    assert.match(base, /this\.container\.classList\?\.add\?\.\('pixel-scroll'\)/);
    assert.match(base, /this\.gameContainer\?\.classList\?\.add\?\.\('pixel-scroll'\)/);
    assert.ok(rules(css('utilities.css'), '.pixel-scroll').length > 0, 'the shared rule exists');
});

// ── The X follows the shell's scroll ──────────────────────────────────────────

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { MinigameScene } = await import(pathToFileURL(join(root, 'js/minigames/framework/base-minigame.js')).href);
const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top });

test('placeCloseButton adds the shell scroll offset, so the X stays in the frame after a scroll', () => {
    document.body.innerHTML = '<div id="mg"></div>';
    class Framed extends MinigameScene { static closeInsideFrame = true; }
    const mg = new Framed(document.getElementById('mg'), { title: 'Box' });
    mg.init();
    mg.container.getBoundingClientRect = () => rect(0, 0, 800, 600);
    // The frame starts 300px above the window: the shell has scrolled 300px down
    mg.gameContainer.getBoundingClientRect = () => rect(100, -300, 600, 1000);
    Object.defineProperty(mg.container, 'scrollTop', { value: 300, configurable: true });
    mg.placeCloseButton();
    const btn = document.getElementById('minigame-close');
    // visible top of the frame (0) + gap (4) + scroll (300), in the shell's scrolled content
    assert.equal(btn.style.top, '304px');
    assert.equal(btn.style.right, '104px');
});

test('a closeInsideFrame scene re-places its X when the shell scrolls', () => {
    document.body.innerHTML = '<div id="mg"></div>';
    class Framed extends MinigameScene { static closeInsideFrame = true; }
    const mg = new Framed(document.getElementById('mg'), { title: 'Box' });
    mg.init();
    let placed = 0;
    mg.placeCloseButton = () => { placed++; };
    mg.start();
    const before = placed;
    mg.container.dispatchEvent(new window.Event('scroll'));
    assert.ok(placed > before, 'scroll on the shell places the X again');
    mg.cleanup?.();
});
