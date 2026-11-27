// Post-release fixes: (1) the capped frame never scrolls as a whole, only a named inner region (.dusting-body) does, and
// that region has room for a focus ring and the pixel scrollbar; (2) every reference card draws its name and match state
// as text (a touch screen has no title tooltip), every card after the match is labelled, only the matched card is framed
// in the accent, names are set as text never markup; (3) a keyboard pick puts focus back on a control, a mouse pick does not.
// Run with: node --test test/js/dusting-frame-body.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '../../public/break_escape');
const css = readFileSync(join(pub, 'css/dusting.css'), 'utf8');
const game = readFileSync(join(pub, 'js/minigames/dusting/dusting-game.js'), 'utf8');
const rule = sel => { const i = css.indexOf(sel + ' {'); assert.ok(i >= 0, `rule ${sel}`); return css.slice(i, css.indexOf('}', i)); };

const tmp = mkdtempSync(join(tmpdir(), 'dusting-body-'));
cpSync(join(pub, 'js'), join(tmp, 'js'), { recursive: true });
writeFileSync(join(tmp, 'package.json'), '{"type":"module"}');
const dom = new JSDOM('<!doctype html><body></body>');
const doc = dom.window.document;
globalThis.window = { gameState: { globalVariables: {} }, innerWidth: 1280, innerHeight: 720 };
globalThis.document = doc;
globalThis.Image = class {};
const { DustingMinigame } = await import(pathToFileURL(join(tmp, 'js/minigames/dusting/dusting-game.js')).href);
const { zoomPlan, zoomBudgetH } = await import(pathToFileURL(join(tmp, 'js/minigames/dusting/dusting-model.js')).href);

const mark = (type, x, y, dx, dy) => ({ type, x, y, dx, dy });
const LONG = 'Bartholomew Featherstonehaugh-Smythe';
/** A compare-step game with a real (JSDOM) panel. _renderPanel is replaced by a small one that builds the same controls. */
function compareGame(labels = ['Jesse Tran', LONG, 'Margaret Sorensen']) {
    const g = Object.create(DustingMinigame.prototype);
    const liftMarks = [mark('ending', 60, 50, 10, -5), mark('bifurcation', 40, 70, -12, 14)];
    const features = (pattern, marks) => ({ pattern, opens: null, marks });
    const panel = doc.createElement('div');
    doc.body.innerHTML = '';
    doc.body.appendChild(panel);
    Object.assign(g, {
        step: 'compare', patternOk: true, identified: false, viewing: null, message: '', dirty: false, fullLift: false,
        ownerName: 'Margaret Sorensen', panel, forensicEl: { textContent: '' }, announced: [],
        print: { pattern: 'whorl', cores: [], deltas: [], minutiae: [] },
        liftMarks, liftFeatures: features('whorl', liftMarks),
        candidates: labels.map((label, i) => ({
            index: i, label, pattern: 'whorl', correct: i === labels.length - 1, rejected: false,
            marks: i === labels.length - 1 ? liftMarks : [mark('ending', 61, 52, 10, -5)]
        }))
    });
    for (const c of g.candidates) c.features = features(c.pattern, c.marks);
    g._renderPanel = function () {
        this.panel.innerHTML = '<div class="dusting-refs"></div><div class="dusting-buttons"></div>';
        this.panel.querySelector('.dusting-refs').appendChild(this._refCards(!!this.identified));
        const b = this.panel.querySelector('.dusting-buttons');
        b.innerHTML = this.identified ? '<button data-action="finish">Log the print</button>' : '<button data-action="unidentified">Log as unidentified</button>';
    };
    g._drawCard = () => {};
    g._updateAria = () => {};
    g.announce = m => g.announced.push(m);
    return g;
}
const cardsOf = (g, done) => { const h = doc.createElement('div'); h.appendChild(g._refCards(done)); return h; };

test('the root is a flex column that does not scroll; the body is the scroll region with room for a focus ring', () => {
    const root = rule('.dusting-root');
    assert.match(root, /display: flex; flex-direction: column/);
    assert.doesNotMatch(root, /overflow-y: auto/, 'root must not scroll as a whole');
    assert.match(root, /overflow: hidden/);
    const body = rule('.dusting-body');
    assert.match(body, /overflow-y: auto/);
    assert.match(body, /min-height: 0/);
    assert.match(body, /flex: 1 1 auto/);
    assert.match(body, /padding: 6px; margin: -6px/, 'ring room, cancelled so the outer size does not change');
    assert.match(body, /scroll-padding: 6px/, 'a control scrolled into view stays clear of the edge, so its ring is not cut');
    assert.match(body, /position: relative/, 'contains the visually hidden status (position: absolute) so it cannot add to the minigame container\'s scroll height');
    assert.match(css, /\.dusting-short \.dusting-body \{ display: contents; \}/);
});

test('a focused control is raised above its later siblings (the primary is excluded, it is sticky)', () => {
    const m = css.match(/([^{}]*:focus-visible[^{}]*)\{[^}]*position: relative; z-index: 2;/);
    assert.ok(m, 'a raise rule');
    for (const c of ['.dusting-ref', '.dusting-jar', '.dusting-pattern', '.dusting-btn:not(.dusting-primary)']) assert.ok(m[1].includes(c + ':focus-visible'), c);
    assert.ok(!/\.dusting-primary:focus-visible/.test(m[1].replace('.dusting-btn:not(.dusting-primary):focus-visible', '')), 'the sticky primary is not made relative');
});

test('short landscape scrolls the root, so it keeps a focused control 6px clear of the edge too', () => {
    assert.match(rule('.dusting-short'), /scroll-padding: 6px/);
});

test('the pinned primary follows the body padding: bottom -6px, so it sits inside the body and its ring is not cut', () => {
    assert.match(css, /\.dusting-primary \{[^}]*position: sticky; bottom: -6px;/);
});

test('the body wraps the main row, forensic line, status and options; the title and steps stay outside; it has the pixel scrollbar', () => {
    const t = game.slice(game.indexOf('<div class="dusting-root'), game.indexOf("this.root = this.gameContainer.querySelector('.dusting-root')"));
    assert.match(t, /class="dusting-root pixel-scroll"/, 'short landscape still scrolls the root');
    assert.match(t, /class="dusting-body pixel-scroll" data-region="dusting-body"/);
    const bodyAt = t.indexOf('class="dusting-body');
    assert.ok(bodyAt > t.indexOf('class="dusting-steps"'), 'steps come before the body');
    assert.ok(bodyAt > t.indexOf('class="dusting-title"'));
    for (const c of ['dusting-main', 'dusting-forensic', 'dusting-status', 'dusting-options']) assert.ok(t.indexOf(`class="${c}`) > bodyAt, c);
});

test('the status line is visually hidden (not display: none) on the desktop compare step', () => {
    const m = css.match(/@media \(min-width: 761px\) \{[^@]*?\.dusting-status \{[^}]*\}/);
    assert.ok(m, 'a desktop compare rule for the status line');
    assert.match(m[0], /data-step="compare"\] \.dusting-status \{[^}]*clip: rect\(0 0 0 0\)/);
    assert.doesNotMatch(m[0], /\.dusting-status \{[^}]*display: none/);
});

test('_zoomLayout measures the body width (less its scrollbar) plus the root padding', () => {
    const budgetH = zoomBudgetH(window.innerHeight, 200);
    const plan = rootW => zoomPlan({ side: 48, availW: rootW - 16 - 4, budgetH, maxS: 2 });
    const key = p => `${p.W}/${p.S}/${p.stacked}`;
    // find a root width where a 15px scrollbar crosses a plan step, so the old formula (root.clientWidth) gives another plan
    let R = 0;
    for (let w = 200; w <= 760 && !R; w++) if (key(plan(w)) !== key(plan(w - 15))) R = w;
    assert.ok(R, 'a plan step exists in the scan range');
    const run = (rootClient, bodyOffset, bodyClient) => {
        const g = compareGame();
        Object.assign(g, { zoomSide: 48, wide: false, _zoomChrome: () => 200 });
        const bodyEl = { clientWidth: bodyClient, offsetWidth: bodyOffset };
        g.root = { clientWidth: rootClient, querySelector: s => (s === '.dusting-body' ? bodyEl : null) };
        return g._zoomLayout(false);
    };
    // body border box = root + 12 of ring room; the scrollbar takes 15 off its clientWidth
    const bar = run(R, R + 12, R + 12 - 15), free = run(R, R + 12, R + 12);
    assert.equal(key(bar), key(plan(R - 15)), 'a body scrollbar narrows the plan as a root 15px narrower would');
    assert.equal(key(free), key(plan(R)));
    assert.notEqual(key(bar), key(free), 'the scrollbar changes the plan, so the old root.clientWidth formula fails here');
});

test('cards: name, tag and state are text; aria-label and title equal the visible words; before the match', () => {
    const g = compareGame();
    g.candidates[0].rejected = true;
    const h = cardsOf(g, false);
    const btns = [...h.querySelectorAll('.dusting-ref')];
    assert.equal(btns.length, 3);
    const expect = [
        ['Reference card 1: Jesse Tran, not a match', '(not a match)'],
        [`Reference card 2: ${LONG}`, null],
        ['Reference card 3: Margaret Sorensen', null]
    ];
    btns.forEach((b, i) => {
        assert.equal(b.getAttribute('aria-label'), expect[i][0]);
        assert.equal(b.title, expect[i][0]);
        const tag = b.querySelector('.dusting-ref-tag');
        assert.equal(tag ? tag.textContent : null, expect[i][1]);
        assert.equal(b.querySelector('.dusting-ref-name').textContent, `${i + 1}. ${g.candidates[i].label}`);
    });
    assert.equal(btns[0].disabled, true);
    assert.equal(btns[1].disabled, false);
    assert.equal(h.querySelectorAll('[data-match]').length, 0, 'no match before the match');
});

test('cards after the match: every card is labelled, only the matched card carries data-match, no view buttons', () => {
    const g = compareGame();
    g.identified = true;
    const h = cardsOf(g, true);
    const btns = [...h.querySelectorAll('.dusting-ref')];
    const states = btns.map(b => b.querySelector('.dusting-ref-tag').textContent);
    assert.deepEqual(states, ['(not a match)', '(not a match)', '(match)']);
    btns.forEach((b, i) => {
        assert.equal(b.getAttribute('aria-label'), `Reference card ${i + 1}: ${g.candidates[i].label}, ${i === 2 ? 'match' : 'not a match'}`);
        assert.equal(b.title, b.getAttribute('aria-label'));
        assert.equal(b.disabled, true);
        assert.equal(b.hasAttribute('data-match'), i === 2);
    });
    assert.equal(h.querySelectorAll('[data-action="view"]').length, 0);
    assert.match(rule('.dusting-ref[data-match]'), /border-color: var\(--d-accent\)/);
    assert.doesNotMatch(rule('.dusting-ref:disabled:not([data-rejected])'), /border-color/);
});

test('a name that looks like markup stays text', () => {
    const g = compareGame(['<img src=x onerror=alert(1)>', 'A & B "quoted"', 'Margaret Sorensen']);
    const h = cardsOf(g, false);
    assert.equal(h.querySelectorAll('img').length, 0);
    assert.equal(h.querySelector('.dusting-ref-name').textContent, '1. <img src=x onerror=alert(1)>');
    assert.equal(h.querySelectorAll('.dusting-ref')[1].getAttribute('aria-label'), 'Reference card 2: A & B "quoted"');
});

test('a card is capped at 144px so a long name wraps inside it, and the name wraps at any point', () => {
    assert.match(rule('.dusting-refs:not([data-count="4"]) .dusting-ref-wrap'), /flex: 0 0 144px; max-width: 144px; min-width: 0/);
    assert.match(rule('.dusting-ref-name'), /overflow-wrap: anywhere/);
    assert.doesNotMatch(css, /\.dusting-ref-name[^{]*\{[^}]*(line-clamp|ellipsis)/);
    assert.doesNotMatch(css, /\.dusting-ref-tag[^{]*\{[^}]*(ellipsis|nowrap)/);
});

test('a keyboard pick of a wrong card re-renders and puts focus on the next open card; the zoom stays on the rejected one', () => {
    const g = compareGame();
    g._renderPanel();
    g._action('ref', { index: '0' }, true);
    assert.equal(g.candidates[0].rejected, true);
    const f = doc.activeElement;
    assert.ok(f && f.classList.contains('dusting-ref'), 'focus is on a card');
    assert.equal(f.dataset.index, '1');
    assert.equal(g.zoomIdx, 0, 'the zoom stays on the card just rejected');
    assert.match(g.announced.at(-1), /No match|differ|pattern/, 'the live message is not overwritten');
});

test('a keyboard pick skips rejected cards, and falls back to "Log as unidentified" when none is open', () => {
    const g = compareGame(['A', 'B']);
    g.candidates[1].correct = true; g.candidates[0].correct = false;
    g.candidates[1].rejected = false;
    g._renderPanel();
    g.candidates.push({ index: 2, label: 'C', pattern: 'whorl', correct: false, rejected: true, marks: [], features: g.candidates[0].features });
    g.candidates[1].correct = false; g.candidates[0].correct = false;
    g.candidates.push({ index: 3, label: 'D', pattern: 'whorl', correct: true, rejected: true, marks: [], features: g.candidates[0].features });
    g._renderPanel();
    g._action('ref', { index: '1' }, true);     // 1 rejected; 2 and 3 already rejected; 0 is open
    assert.equal(doc.activeElement.dataset.index, '0', 'wraps round to the only open card');
    g._action('ref', { index: '0' }, true);     // every card rejected
    assert.equal(doc.activeElement.dataset.action, 'unidentified');
});

test('a keyboard pick of the right card moves focus to "Log the print"', () => {
    const g = compareGame();
    g._renderPanel();
    g._action('ref', { index: '2' }, true);
    assert.equal(g.identified, true);
    assert.equal(doc.activeElement.dataset.action, 'finish');
});

test('a mouse pick does not move focus', () => {
    const g = compareGame();
    g._renderPanel();
    const before = doc.activeElement;
    g._action('ref', { index: '0' }, false);
    assert.equal(g.candidates[0].rejected, true);
    assert.equal(doc.activeElement, before, 'focus untouched by a pointer pick');
    g._action('ref', { index: '2' }, false);
    assert.equal(g.identified, true);
    assert.equal(doc.activeElement, before);
});

/** Wire the real panel routes (click, pointerover, focusin) on the JSDOM panel and count announcements. */
function wired(labels) {
    const g = compareGame(labels);
    g.addEventListener = (t, ev, fn) => t.addEventListener(ev, fn);
    g.gameState = { isActive: true };
    g._drawZoom = () => {};
    g._zoomSpeech = 'Card words.';
    g._renderPanel();
    g._bindPanel();
    return g;
}
const click = (el, detail) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true, detail }));

test('a click with detail 0 (Enter, Space, assistive tech) refocuses a control; detail 1 (a pointer) does not', () => {
    const g = wired();
    doc.body.focus();
    const before = doc.activeElement;
    click(g.panel.querySelector('.dusting-ref[data-index="0"]'), 1);
    assert.equal(g.candidates[0].rejected, true);
    assert.equal(doc.activeElement, before, 'a pointer click leaves focus alone');
    const g2 = wired();
    click(g2.panel.querySelector('.dusting-ref[data-index="0"]'), 0);
    assert.equal(g2.candidates[0].rejected, true);
    assert.equal(doc.activeElement.dataset.index, '1', 'a keyboard click puts focus on the next open card');
});

test('the refocus guard: a keyboard pick neither moves the zoom nor announces over the message; a plain Tab does', () => {
    const g = wired();
    g.panel.querySelector('.dusting-ref[data-index="0"]').focus();   // focusin zooms to card 0 and speaks it
    assert.equal(g.zoomIdx, 0);
    g.announced.length = 0;
    click(g.panel.querySelector('.dusting-ref[data-index="0"]'), 0);
    assert.equal(doc.activeElement.dataset.index, '1');
    assert.equal(g.zoomIdx, 0, 'the focusin on card 2 did not move the zoom');
    assert.equal(g.announced.length, 1, 'only the mismatch message was announced');
    assert.match(g.announced[0], /No match|differ|pattern/);
    g.panel.querySelector('.dusting-ref[data-index="2"]').focus();   // a Tab onto another card
    assert.equal(g.zoomIdx, 2);
    assert.equal(g.announced.at(-1), 'Card words.');
});

test('focus moves before the message is announced (a focus change can cut queued speech)', () => {
    const g = wired();
    const seen = [];
    g.announce = m => seen.push({ m, focus: doc.activeElement && doc.activeElement.dataset.index });
    g._action('ref', { index: '0' }, true);
    assert.equal(seen.at(-1).focus, '1', 'focus was already on card 2 when the message went out');
    const h = wired();
    const seen2 = [];
    h.announce = m => seen2.push({ m, action: doc.activeElement && doc.activeElement.dataset.action });
    h._action('ref', { index: '2' }, true);
    assert.equal(seen2.at(-1).action, 'finish');
});

test('number keys 1 to n pick a card and keep keyboard focus; with no focus in the panel they do not pull it in', () => {
    const g = wired();
    g.panel.querySelector('.dusting-ref[data-index="0"]').focus();
    g._onKeyDown({ key: '1', target: doc.activeElement, preventDefault() {} });
    assert.equal(g.candidates[0].rejected, true);
    assert.equal(doc.activeElement.dataset.index, '1', 'focus lands on the next open card, not the page');
    g._onKeyDown({ key: '3', target: doc.activeElement, preventDefault() {} });
    assert.equal(g.identified, true);
    assert.equal(doc.activeElement.dataset.action, 'finish');
    const h = wired();
    doc.body.focus();
    h._onKeyDown({ key: '1', target: doc.body, preventDefault() {} });
    assert.equal(h.candidates[0].rejected, true);
    assert.ok(!h.panel.contains(doc.activeElement), 'a pick with focus outside the panel does not grab focus');
});
