// Dusting D183 item 5: after 3 misses, or an idle period, the Hint button is revealed if hidden, framed with a 2px
// border, and the words "Stuck? Try Hint" appear (textContent; never colour alone). A UI label, not spoken text.
// Run with: node --max-old-space-size=2048 test/js/dusting-nudge.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '../../public/break_escape');
const root = mkdtempSync(join(tmpdir(), 'dusting-nudge-'));
cpSync(join(pub, 'js'), join(root, 'js'), { recursive: true });
writeFileSync(join(root, 'package.json'), '{"type":"module"}');

const el = () => ({ setAttribute() {}, appendChild() {}, style: {} });
globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { getElementById: () => null, createElement: el, head: { appendChild() {} }, body: { appendChild() {} } };
globalThis.Image = class {};
const m = await import(pathToFileURL(join(root, 'js/minigames/dusting/dusting-model.js')).href);
const { DustingMinigame } = await import(pathToFileURL(join(root, 'js/minigames/dusting/dusting-game.js')).href);
const { hintNudgeDue, NUDGE_TEXT, NUDGE_MISSES, NUDGE_IDLE_MS, DIFFICULTY } = m;

test('policy: 3 misses or the idle period; never once found', () => {
    assert.ok(NUDGE_MISSES === 3, 'three misses');
    assert.ok(hintNudgeDue({ misses: 2 }) === false, 'two misses is not enough');
    assert.ok(hintNudgeDue({ misses: 3 }) === true, 'three misses');
    assert.ok(hintNudgeDue({ idleMs: NUDGE_IDLE_MS - 1 }) === false, 'just under idle');
    assert.ok(hintNudgeDue({ idleMs: NUDGE_IDLE_MS }) === true, 'idle');
    assert.ok(hintNudgeDue({ misses: 5, found: true }) === false, 'found');
    assert.ok(NUDGE_TEXT === 'Stuck? Try Hint', 'label text');
});

/** A find-step game with a print mask of zeros (every check misses) and a recording timer. */
function game() {
    const g = Object.create(DustingMinigame.prototype);
    const N = 128;
    Object.assign(g, {
        step: 'find', found: false, hintReady: false, nudged: false, misses: 0, message: '', _timers: [], diff: DIFFICULTY.medium,
        print: { mask: new Float32Array(N * N) }, announced: [], renders: 0, later: [], dirty: false,
        panel: { querySelector: () => null }
    });
    g._later = (fn, ms) => { const t = { fn, ms }; g.later.push(t); return t; };
    g._renderPanel = () => { g.renders++; };
    g._refreshDynamic = () => {};
    g.announce = t => g.announced.push(t);
    return g;
}

test('misses: the nudge fires on the third failed check, not before', () => {
    const g = game();
    g._attemptFind({ x: 5, y: 5 }); g._attemptFind({ x: 6, y: 6 });
    assert.ok(g.nudged === false && g.hintReady === false, 'nothing after two');
    g._attemptFind({ x: 7, y: 7 });
    assert.ok(g.nudged === true, 'nudged');
    assert.ok(g.hintReady === true, 'hidden Hint button revealed');
    assert.ok(g.renders === 1, 'panel re-rendered once');
    assert.ok(g.announced.includes(NUDGE_TEXT), 'announced to screen readers');
    g._attemptFind({ x: 8, y: 8 });
    assert.ok(g.renders === 1, 'does not re-render on every later miss');
});

test('idle: arming sets one timer of NUDGE_IDLE_MS; each miss re-arms it; firing nudges', () => {
    const g = game();
    g._armNudge();
    assert.ok(g.later.length === 1 && g.later[0].ms === NUDGE_IDLE_MS, 'one idle timer');
    g._attemptFind({ x: 5, y: 5 });
    assert.ok(g.later.length === 2, 're-armed by a miss');
    g.later[g.later.length - 1].fn();
    assert.ok(g.nudged === true && g.hintReady === true, 'idle fire nudges');
});

test('idle fire does nothing once the print is found or the step moved on', () => {
    const a = game(); a._armNudge(); a.found = true; a.later[0].fn();
    assert.ok(a.nudged === false, 'found');
    const b = game(); b._armNudge(); b.step = 'powder'; b.later[0].fn();
    assert.ok(b.nudged === false, 'other step');
});

test('Find panel: nudged Hint button carries the 2px frame class and the label slot; not nudged has neither', () => {
    const g = game();
    const plain = g._htmlFind();
    assert.ok(!plain.includes('dusting-nudged'), 'no frame class before');
    assert.ok(plain.includes('data-dyn="nudge"') && plain.includes('hidden'), 'label slot present, Hint hidden');
    g.nudged = true; g.hintReady = true;
    const html = g._htmlFind();
    assert.ok(html.includes('dusting-hint dusting-nudged'), 'frame class');
    assert.ok(!/data-action="hint"\s+hidden/.test(html), 'Hint visible');
});

test('label is set through textContent from the dynamic refresh, not markup', () => {
    const g = Object.create(DustingMinigame.prototype);
    const slots = { feedback: { textContent: 'x' }, nudge: { textContent: '', innerHTML: 'UNTOUCHED' } };
    Object.assign(g, { step: 'find', nudged: true, message: 'm', metrics: { coverage: 0 }, panel: { querySelector: q => slots[/"(.+)"/.exec(q)[1]] || null } });
    g._refreshDynamic();
    assert.ok(slots.nudge.textContent === NUDGE_TEXT, 'text set');
    assert.ok(slots.nudge.innerHTML === 'UNTOUCHED', 'markup path unused');
    g.nudged = false; g._refreshDynamic();
    assert.ok(slots.nudge.textContent === '', 'cleared when not nudged');
});

test('CSS: the nudge frame is 2px, solid, no radius, no blur', () => {
    const css = readFileSync(join(pub, 'css/dusting.css'), 'utf8');
    const rule = /\.dusting-btn\.dusting-nudged\s*\{([^}]*)\}/.exec(css);
    assert.ok(rule !== null, 'rule exists');
    assert.ok(/border:\s*2px solid/.test(rule[1]) && !/radius|blur|gradient/.test(rule[1]), '2px solid, no radius or blur');
});
