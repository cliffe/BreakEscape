// Dusting phone action footer: on phone portrait the examine and compare action row is the last child of the scrolling
// .dusting-body (so a sticky row pins to the scrollport foot); on desktop and short landscape it stays in the panel.
// Renders the real _htmlExamine / _htmlCompare on a JSDOM frame. Run with: node --max-old-space-size=2048 test/js/dusting-foot-placement.test.mjs
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
const tmp = mkdtempSync(join(tmpdir(), 'dusting-foot-'));
cpSync(join(pub, 'js'), join(tmp, 'js'), { recursive: true });
writeFileSync(join(tmp, 'package.json'), '{"type":"module"}');
const dom = new JSDOM('<!doctype html><body></body>');
const doc = dom.window.document;
globalThis.window = { gameState: { globalVariables: {}, biometricSamples: [] }, innerWidth: 390, innerHeight: 844 };
globalThis.document = doc;
globalThis.Image = class {};
const { DustingMinigame } = await import(pathToFileURL(join(tmp, 'js/minigames/dusting/dusting-game.js')).href);

/** The frame as init() builds it (same nesting), with a game object whose html methods are the real ones. */
function frame(w, h, short, over = {}) {
    window.innerWidth = w; window.innerHeight = h;
    doc.body.innerHTML = `<div class="dusting-root${short ? ' dusting-short' : ''}"><div class="dusting-body"><div class="dusting-main">
        <div class="dusting-stage"></div><div class="dusting-panel"></div></div><p class="dusting-forensic"></p>
        <div class="dusting-status"></div><div class="dusting-options"></div></div></div>`;
    const root = doc.querySelector('.dusting-root');
    const g = Object.create(DustingMinigame.prototype);
    Object.assign(g, { root, panel: doc.querySelector('.dusting-panel'), data: { id: 'p', name: 'Round panel' }, objectId: 'p',
        surface: { description: 'Painted metal.' }, resume: null, patternOk: false, identified: false, candidates: [], print: { pattern: 'whorl', cores: [], deltas: [], minutiae: [] }, ...over });
    return g;
}
const put = (g, html) => { g.panel.innerHTML = html; g._placeFoot(); };
const body = g => g.root.querySelector('.dusting-body');
const foot = g => g.root.querySelector('.dusting-foot');
const lift = (id, extra = {}) => window.gameState.biometricSamples.push({ sourceObjectId: id, quality: 0.78, rating: 'Good', owner: 'X', identified: false, ...extra });

const examineCases = {
    'resume': g => { lift('e_resume'); g.objectId = g.data.id = 'e_resume'; g.resume = { step: 'dust' }; },
    'lift on file': g => { lift('e_lift'); g.objectId = g.data.id = 'e_lift'; },
    'fresh': g => { g.objectId = g.data.id = 'e_fresh'; }
};
const compareCases = {
    'unnamed': g => { g.patternOk = false; },
    'named': g => { g.patternOk = true; g.identified = false; g.candidates = [{ index: 0, label: 'A' }]; g.liftMarks = []; },
    'matched': g => { g.patternOk = true; g.identified = true; g.ownerName = 'Margaret Sorensen'; g.candidates = [{ index: 0, label: 'A' }]; }
};
const html = (g, kind) => (kind === 'examine' ? g._htmlExamine() : g._htmlCompare());

for (const [kind, cases] of [['examine', examineCases], ['compare', compareCases]]) {
    for (const [name, setup] of Object.entries(cases)) {
        test(`${kind} (${name}): at 390x844 the footer row is the last child of the scrolling body, with its class`, () => {
            const g = frame(390, 844, false, { step: kind, final: { quality: 0.7, rating: 'Fair' } });
            setup(g);
            put(g, html(g, kind));
            const f = foot(g);
            assert.ok(f !== null, 'the row exists');
            assert.ok(f.classList.contains('dusting-buttons') && f.classList.contains('dusting-foot'), 'row keeps both classes');
            assert.ok(f.parentNode === body(g), 'parent is .dusting-body (the scroller), not the panel');
            assert.ok(body(g).lastElementChild === f, 'it is the last child, after forensic, status and options');
            assert.ok(g.panel.querySelector('.dusting-foot') === null, 'nothing left in the panel');
            assert.ok(f.querySelectorAll('button').length >= 1, 'buttons moved with the row');
        });
        test(`${kind} (${name}): desktop 1280x720 and short landscape 844x390 keep the row at the end of the panel`, () => {
            for (const [w, h, short] of [[1280, 720, false], [844, 390, true]]) {
                const g = frame(w, h, short, { step: kind, final: { quality: 0.7, rating: 'Fair' } });
                setup(g);
                put(g, html(g, kind));
                assert.ok(foot(g).parentNode === g.panel, `${w}x${h}: parent is the panel`);
                assert.ok(g.panel.lastElementChild === foot(g), `${w}x${h}: last in the panel`);
            }
        });
    }
}

test('a resize from phone portrait to desktop moves the row back into the panel, and back again', () => {
    const g = frame(390, 844, false, { step: 'examine' });
    examineCases.fresh(g);
    put(g, g._htmlExamine());
    assert.ok(foot(g).parentNode === body(g));
    window.innerWidth = 1280; g._placeFoot();
    assert.ok(foot(g).parentNode === g.panel, 'back in the panel at 1280');
    window.innerWidth = 390; g._placeFoot();
    assert.ok(foot(g).parentNode === body(g), 'and in the body at 390');
});

test('_placeFoot publishes the measured row height, and does nothing when there is no frame, body or row', () => {
    const g = frame(390, 844, false, { step: 'examine' });
    examineCases.fresh(g);
    g.panel.innerHTML = g._htmlExamine();
    Object.defineProperty(foot(g), 'offsetHeight', { value: 54 });
    g._placeFoot();
    assert.ok(g.root.style.getPropertyValue('--d-foot-h') === '60px', 'height plus 6px');
    const empty = frame(390, 844, false, { step: 'examine' });
    empty._placeFoot();                                  // no row yet
    empty.root.querySelector('.dusting-body').remove();
    empty._placeFoot();                                  // no body
    const bare = Object.create(DustingMinigame.prototype);
    bare._placeFoot();                                   // no root at all
    assert.ok(true);
});

test('a click on a footer button in the body routes to _action; a panel click is not handled twice', () => {
    const g = frame(390, 844, false, { step: 'examine' });
    examineCases.fresh(g);
    g.addEventListener = (t, ev, fn) => t.addEventListener(ev, fn);
    g.gameState = { isActive: true };
    const calls = [];
    g._action = (a) => calls.push(a);
    put(g, g._htmlExamine());
    g._bindPanel();
    const click = el => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, detail: 1 }));
    click(foot(g).querySelector('[data-action="start"]'));
    assert.ok(calls.length === 1 && calls[0] === 'start', 'footer click handled once');
    g.panel.insertAdjacentHTML('beforeend', '<button data-action="ref">x</button>');
    click(g.panel.querySelector('[data-action="ref"]'));
    assert.ok(calls.length === 2 && calls[1] === 'ref', 'panel click handled once');
});

test('_findInPanel and _refocus reach a button in the footer row, in the body or the panel', () => {
    const g = frame(390, 844, false, { step: 'compare', final: { quality: 0.7, rating: 'Fair' } });
    compareCases.unnamed(g);
    put(g, g._htmlCompare());
    const b = g._findInPanel('[data-action="unidentified"]');
    assert.ok(b !== null && b.parentNode === foot(g), 'found in the body footer');
    assert.ok(g._refocus('[data-action="unidentified"]') === true);
    assert.ok(doc.activeElement === b, 'focus moved to it');
    assert.ok(g._findInPanel('[data-action="nope"]') === null);
});

test('CSS: phone portrait sticks the row to the scrollport foot, scroll-padding clears it, short compare pins to the root', () => {
    const at = sel => { const i = css.indexOf(sel + ' {'); assert.ok(i >= 0, sel); return css.slice(i, css.indexOf('}', i)); };
    const phone = at('.dusting-root:not(.dusting-short) .dusting-buttons.dusting-foot');
    assert.ok(/position: sticky/.test(phone) && /bottom: -6px/.test(phone) && /background: var\(--d-bg\)/.test(phone) && /border-top: 2px solid/.test(phone));
    const pad = at('.dusting-root:not(.dusting-short):is([data-step="examine"], [data-step="compare"]) .dusting-body');
    assert.ok(/scroll-padding-bottom: var\(--d-foot-h, 64px\)/.test(pad));
    const sc = at('.dusting-short[data-step="compare"] .dusting-buttons.dusting-foot');
    assert.ok(/position: sticky/.test(sc) && /bottom: -6px/.test(sc) && /background: var\(--d-bg\)/.test(sc) && /border-top: 2px solid/.test(sc));
    assert.ok(/scroll-padding-bottom: var\(--d-foot-h, 50px\)/.test(at('.dusting-short[data-step="compare"]')));
    assert.ok(!/radius|blur|gradient/.test(phone + sc + pad));
});
