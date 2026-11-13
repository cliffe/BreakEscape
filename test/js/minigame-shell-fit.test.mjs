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

test('the game area is capped to the shell with no specificity, so scene sizes still win', () => {
    const r = rule(framework, ':where(.minigame-container > .minigame-game-container)');
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

// ── Lock and core scenes (critique A) ─────────────────────────────────────────

test('combination: below 600px the dials stack and nothing is centred past the edge (A01)', () => {
    const r = rule(css('combination-minigame.css'), '.combination-dials', 'max-width: 600px');
    assert.equal(r['flex-direction'], 'column');
    assert.equal(r['justify-content'], 'safe center');
    assert.equal(r.overflow, 'visible', 'no crop of the outer dials');
    const d = rule(css('combination-minigame.css'), '.combination-dial-display', 'max-width: 600px');
    assert.equal(Number.parseInt(d['font-size'], 10) % 8, 0, 'Press Start 2P on its grid');
    assert.match(src('minigames/combination/combination-minigame.js'), /scrollIntoView\?\.\(\{ block: 'nearest'/, 'the active dial is brought on screen');
});

test('cryptex: below 600px five wheels fit and longer words wrap (A02)', () => {
    const r = rule(css('cryptex-minigame.css'), '.cryptex-wheels', 'max-width: 600px');
    assert.equal(r['flex-wrap'], 'wrap');
    assert.equal(r['justify-content'], 'safe center');
    assert.equal(r.overflow, 'visible');
    const d = rule(css('cryptex-minigame.css'), '.cryptex-wheel-display', 'max-width: 600px');
    // 36 + 2 x 8 padding + 2 x 2 border = 56px a wheel: five wheels and gaps under 360px
    assert.equal(d.width, '36px');
    assert.equal(d['font-size'], '41px', 'a crisp GNF size');
});

test('notes: the notepad fits a phone and the nav row is in the flow under it (A03, A04, A06)', () => {
    const notes = css('notes.css');
    assert.equal(rules(notes, '.notes-minigame-notepad', 'max-width: 768px').some(r => r.left), false, 'no left shift');
    assert.equal(rule(notes, '.notes-minigame-notepad', 'max-width: 768px')['min-width'], '0');
    const nav = rule(notes, '.notes-minigame-nav-container');
    assert.equal(nav.position, 'relative');
    assert.equal(nav['flex-wrap'], 'wrap');
    assert.equal(nav.bottom, undefined, 'not pinned over the page');
    const tape = rule(notes, '.notes-minigame-celotape');
    assert.equal(tape.border, undefined, 'no grey box that reads as an empty field');
    const js = src('minigames/notes/notes-minigame.js');
    assert.match(js, /this\.gameContainer\.after\(navContainer\)/);
    assert.match(js, /closeAnchor\(\) \{\s*return this\.gameContainer\?\.querySelector\?\.\('\.notes-minigame-notepad'\)/);
    assert.match(js, /notes-minigame-content-area pixel-scroll/);
});

test('PIN: a wrong code is reported on the keypad\'s own line, not over the keys (A10, A11)', () => {
    const js = src('minigames/pin/pin-minigame.js');
    assert.match(js, /className = 'pin-minigame-message'/);
    assert.doesNotMatch(js, /this\.showFailure\(message, false, 1500\)/);
    assert.ok(rule(css('pin.css'), '.pin-minigame-message')['min-height'], 'keeps its height when empty');
    assert.equal(rule(css('pin.css'), '.pin-minigame-attempt.incorrect').background, '#2c3e50');
});

test('alarm panel: scrolls on a short window, stepped lamps, 8px labels, X in the panel (A41-A43)', () => {
    const c = css('alarm-panel-minigame.css');
    const g = rule(c, '.ap-game-container');
    assert.equal(g.overflow, 'auto');
    assert.equal(g['justify-content'], 'safe center');
    assert.equal(rule(c, '.ap-panel-wrap')['max-height'], '100%');
    assert.equal(rule(c, '.ap-label')['font-size'], '8px');
    assert.equal(rule(c, '.ap-row-sep')['stroke-width'], '2');
    assert.equal(rule(c, '.ap-live-dot')['border-radius'], undefined);
    const js = src('minigames/alarm-panel/alarm-panel-minigame.js');
    assert.doesNotMatch(js, /<circle/);
    assert.match(js, /static closeInsideFrame = true;/);
});

test('alarm panel lamp points step in whole 4px squares', async () => {
    const { steppedLampPoints } = await import(pathToFileURL(join(root, 'js/minigames/alarm-panel/alarm-panel-minigame.js')).href);
    const pts = steppedLampPoints(40, 64, 16).split(' ').map(p => p.split(',').map(Number));
    assert.equal(pts.length, 20);
    for (let i = 0; i < pts.length; i++) {
        const [a, b] = [pts[i], pts[(i + 1) % pts.length]];
        assert.ok(a[0] === b[0] || a[1] === b[1], 'every edge is horizontal or vertical');
    }
    const xs = pts.map(p => p[0]);
    assert.deepEqual([Math.min(...xs), Math.max(...xs)], [24, 56]);
});

test('biometrics: the samples list keeps two rows; instructions are a closed disclosure (A18, A19)', () => {
    const c = css('biometrics-minigame.css');
    const l = rule(c, '.biometrics-samples-list-container');
    assert.equal(l['min-height'], '160px');
    assert.equal(l.flex, '0 0 auto');
    assert.match(src('minigames/biometrics/biometrics-minigame.js'), /document\.createElement\('details'\);\s*instructionsContainer\.className = 'biometrics-scanner-instructions'/);
    assert.equal(rule(c, '.biometrics-categories', 'max-width: 768px')['flex-direction'], undefined, 'chips stay inline');
});

test('X inside the frame for dusting, examine, flag station, VM launcher, text file (A14, A26, A30, A34, A40)', () => {
    for (const f of ['dusting/dusting-game.js', 'examine/examine-minigame.js', 'flag-station/flag-station-minigame.js',
        'vm-launcher/vm-launcher-minigame.js', 'text-file/text-file-minigame.js']) {
        assert.match(src(`minigames/${f}`), /static closeInsideFrame = true;/, f);
    }
    assert.match(src('minigames/dusting/dusting-game.js'), /querySelector\?\.\('\.dusting-root'\)/);
    assert.doesNotMatch(src('minigames/dusting/dusting-game.js'), /data-action="close"/, 'no Close beside the X (A16)');
    const tf = src('minigames/text-file/text-file-minigame.js');
    assert.doesNotMatch(tf, /class="window-controls"/, 'no traffic-light buttons');
    assert.match(tf, /querySelector\?\.\('\.text-file-container'\)/);
    assert.equal(rule(css('biometrics-minigame.css'), '.fpr-led').position, undefined, 'the reader LED is in the heading row, not in the X corner (A24)');
});

test('no Courier New or hairlines left in the flag station and VM launcher (A27, A30)', () => {
    for (const f of ['flag-station/flag-station-minigame.js', 'vm-launcher/vm-launcher-minigame.js']) {
        assert.doesNotMatch(src(`minigames/${f}`), /Courier New|1px solid/, f);
    }
    for (const f of ['flag-station-minigame.css', 'vm-launcher-minigame.css']) {
        assert.doesNotMatch(css(f), /Courier New|1px solid/, f);
    }
    assert.doesNotMatch(src('minigames/vm-launcher/vm-launcher-minigame.js'), /in the game\./, 'no fourth-wall copy (A31)');
});

test('dusting kit is capped to the window and scrolls inside its frame (A15, A17)', () => {
    const c = css('dusting.css');
    assert.equal(rule(c, '.dusting-root')['overflow-y'], 'auto');
    assert.equal(rule(c, '.minigame-container > .dusting-game-container')['max-height'], 'none');
    assert.equal(rule(c, '.dusting-options input[type="checkbox"]').appearance, 'none');
    assert.doesNotMatch(c, /1px solid/);
});

test('lockpicking phone window covers the lock and its labels; labels have a backing (A07, A08)', () => {
    const js = src('minigames/lockpicking/lockpicking-game-phaser.js');
    assert.match(js, /config\.width = 580;\s*config\.height = 340;\s*this\._portraitCameraOffset = \{ x: 0, y: 20 \}/);
    assert.equal((src('minigames/lockpicking/pin-management.js').match(/backgroundColor: '#0b0f0c'/g) || []).length, 4);
});

test('title hint on its grid with a line height (A37); text-file toolbar readable on phones (A36)', () => {
    const t = rule(css('title-screen.css'), '.title-screen-prompt-hint');
    assert.equal(t['font-size'], '8px');
    assert.equal(t['line-height'], '16px');
    assert.equal(rule(css('text-file-minigame.css'), '.action-btn', 'max-width: 768px')['font-size'], '16px');
});
