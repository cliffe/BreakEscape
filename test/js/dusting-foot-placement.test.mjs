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
                if (short && kind === 'compare') {   // the root scrolls there: the row is the root's last child, not the panel's
                    assert.ok(foot(g).parentNode === g.root && g.root.lastElementChild === foot(g), `${w}x${h}: last child of the root`);
                    assert.ok(g.panel.querySelector('.dusting-foot') === null, `${w}x${h}: none left in the panel`);
                    continue;
                }
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

test('_placeFoot phone boundary: 760 is phone (row in the body), 761 is wide (row in the panel), with and without matchMedia', () => {
    for (const withMm of [true, false]) {
        for (const [w, inBody] of [[760, true], [761, false]]) {
            const g = frame(w, 844, false, { step: 'examine' });
            if (withMm) window.matchMedia = q => ({ matches: w <= 760, media: q }); else delete window.matchMedia;
            try {
                examineCases.fresh(g);
                put(g, g._htmlExamine());
                const label = `${w}px, matchMedia ${withMm ? 'present' : 'absent'}`;
                assert.ok((foot(g).parentNode === body(g)) === inBody, `${label}: row ${inBody ? 'in the body' : 'not in the body'}`);
                assert.ok((foot(g).parentNode === g.panel) === !inBody, `${label}: row ${inBody ? 'not in the panel' : 'in the panel'}`);
            } finally { delete window.matchMedia; }
        }
    }
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
    // portrait flush rule: the body's 6px bottom padding must not sit under the row at max scroll
    assert.ok(/margin: 8px 0 -6px/.test(phone), 'portrait row has margin-bottom -6px');
    assert.ok(!/radius|blur|gradient/.test(phone + sc + pad));
});

// ---- Driving the real paths (_renderPanel, _layout, _toggleWholeLift, the key handler), not the _placeFoot helper ----

/** A game whose other draw methods are stubs, so _renderPanel and _layout run as they do live. */
function live(w, h, short, step, setup) {
    const g = frame(w, h, short, { step, final: { quality: 0.7, rating: 'Fair' } });
    (step === 'examine' ? examineCases : compareCases)[setup](g);
    Object.assign(g, {
        canvas: { style: {}, hidden: false }, stageNote: null, keysEl: null, forensicEl: null, metrics: null, _timers: [], zoomIdx: 0,
        _drawKeyGlyphs() {}, _applyLabels() {}, _refreshDynamic() {}, _drawZoom() {}, _updateAria() {}, _drawCard() {}, _drawReferences() {},
        _refCards() { return doc.createDocumentFragment(); }, announce() {}
    });
    return g;
}
const footCount = g => g.root.querySelectorAll('.dusting-foot').length;
const place = g => (foot(g).parentNode === body(g) ? 'body' : foot(g).parentNode === g.panel ? 'panel' : foot(g).parentNode === g.root ? 'root' : 'other');

test('_renderPanel twice at 390x844: exactly one row in the root, and it is the body\'s last child (stale row removed, _placeFoot called)', () => {
    for (const [step, setup] of [['examine', 'fresh'], ['compare', 'unnamed']]) {
        const g = live(390, 844, false, step, setup);
        g._renderPanel();
        assert.ok(footCount(g) === 1, `${step}: one row after the first render`);
        assert.ok(place(g) === 'body' && body(g).lastElementChild === foot(g), `${step}: row in the body, last child`);
        g._renderPanel();
        assert.ok(footCount(g) === 1, `${step}: still one row after the second render`);
        assert.ok(place(g) === 'body' && body(g).lastElementChild === foot(g), `${step}: row still the body's last child`);
        assert.ok(g.panel.querySelector('.dusting-foot') === null, `${step}: none in the panel`);
    }
});

test('_renderPanel on desktop and short landscape leaves one row, in the panel', () => {
    for (const [w, h, short] of [[1280, 720, false], [844, 390, true]]) {
        const g = live(w, h, short, 'examine', 'fresh');
        g._renderPanel(); g._renderPanel();
        assert.ok(footCount(g) === 1 && place(g) === 'panel', `${w}x${h}`);
    }
});

test('_layout (resize) moves the row: 390x844 body, 844x390 panel, 1280x720 panel, and back', () => {
    const g = live(390, 844, false, 'examine', 'fresh');
    g._layout(); g._renderPanel();
    assert.ok(place(g) === 'body', '390x844');
    for (const [w, h, want] of [[844, 390, 'panel'], [390, 844, 'body'], [1280, 720, 'panel'], [390, 844, 'body']]) {
        window.innerWidth = w; window.innerHeight = h;
        g._layout();
        assert.ok(place(g) === want, `${w}x${h}: ${want}`);
        assert.ok(footCount(g) === 1, `${w}x${h}: one row`);
    }
});

test('the phone boundary: 760 wide puts the row in the body, 761 in the panel (matchMedia absent, innerWidth fallback)', () => {
    const g = live(760, 844, false, 'examine', 'fresh');
    g._renderPanel();
    assert.ok(place(g) === 'body', '760');
    window.innerWidth = 761; g._layout();
    assert.ok(place(g) === 'panel', '761');
});

test('the phone test follows matchMedia when the browser has it', () => {
    const g = live(390, 844, false, 'examine', 'fresh');
    window.matchMedia = q => ({ matches: false, media: q });
    try {
        g._renderPanel();
        assert.ok(place(g) === 'panel', 'matchMedia says wide: panel, though innerWidth is 390');
        let asked = '';
        window.matchMedia = q => { asked = q; return { matches: true }; };
        g._layout();
        assert.ok(place(g) === 'body' && asked === '(max-width: 760px)', 'matchMedia says phone: body');
    } finally { delete window.matchMedia; }
});

test('desktop click on a footer button (row in the panel) runs _action once, not from both listeners', () => {
    const g = live(1280, 720, false, 'examine', 'fresh');
    g.addEventListener = (t, ev, fn) => t.addEventListener(ev, fn);
    g.gameState = { isActive: true };
    const calls = [];
    g._action = a => calls.push(a);
    g._renderPanel();
    g._bindPanel();
    foot(g).querySelector('[data-action="start"]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, detail: 1 }));
    assert.ok(calls.length === 1, 'one call');
    // and after a re-render the new row still routes once
    g._renderPanel();
    foot(g).querySelector('[data-action="start"]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, detail: 1 }));
    assert.ok(calls.length === 2, 'one more call after a re-render');
});

test('_toggleWholeLift in portrait compare keeps focus on the new Whole lift button (it lives in the body row)', () => {
    const g = live(390, 844, false, 'compare', 'named');
    g._zoomShort = false; g.fullLift = false;
    g._renderPanel();
    g._toggleWholeLift();
    const b = foot(g).querySelector('[data-action="fulllift"]');
    assert.ok(g.fullLift === true, 'toggled');
    assert.ok(b !== null && b.parentNode === foot(g) && foot(g).parentNode === body(g), 'button is in the body row');
    assert.ok(doc.activeElement === b, 'focus is on the new button, not the page');
});

test('a 1 to 9 key with focus on the body footer row counts as focus in the panel (viaKey true); outside both it does not', () => {
    const g = live(390, 844, false, 'compare', 'named');
    g.gameState = { isActive: true };
    g.candidates = [{ index: 0, label: 'A' }, { index: 1, label: 'B' }];
    g._renderPanel();
    const picks = [];
    g._chooseRef = (i, viaKey) => picks.push(`${i}:${viaKey}`);
    const press = key => g._onKeyDown({ key, target: doc.activeElement, preventDefault() {} });
    const b = foot(g).querySelector('[data-action="unidentified"]');
    assert.ok(b !== null && foot(g).parentNode === body(g));
    b.focus();
    press('2');
    assert.ok(picks[0] === '1:true', `focus in the body row: ${picks[0]}`);
    doc.body.insertAdjacentHTML('beforeend', '<span id="outside" tabindex="0"></span>');
    doc.getElementById('outside').focus();
    press('1');
    assert.ok(picks[1] === '0:false', `focus outside: ${picks[1]}`);
});

test('CSS: short landscape footers keep 6px under the buttons so the focus ring is not clipped', () => {
    const at = sel => { const i = css.indexOf(sel + ' {'); assert.ok(i >= 0, sel); return css.slice(i, css.indexOf('}', i)); };
    assert.ok(/padding: 4px 0 6px/.test(at('.dusting-short[data-step="examine"] .dusting-buttons.dusting-foot')));
    assert.ok(/padding: 4px 0 6px/.test(at('.dusting-short[data-step="compare"] .dusting-buttons.dusting-foot')));
});

// ---- Live-r2 fixes: portrait flush at max scroll, short landscape compare pins to the root ----

test('CSS: short compare row spans the grid rows at the end of column 2, with a sixth row of its height and margin-bottom -6px', () => {
    const at = sel => { const i = css.indexOf(sel + ' {'); assert.ok(i >= 0, sel); return css.slice(i, css.indexOf('}', i)); };
    const row = at('.dusting-short[data-step="compare"] > .dusting-buttons.dusting-foot');
    assert.ok(/grid-row: 1 \/ -1/.test(row) && /grid-column: 2/.test(row) && /align-self: end/.test(row) && /margin: 4px 0 -6px/.test(row), row);
    const root = at('.dusting-short[data-step="compare"]');
    assert.ok(/grid-template-rows: auto auto auto auto auto calc\(var\(--d-foot-h, 50px\) - 6px\)/.test(root), 'sixth grid row reserves the row');
    assert.ok(/overflow-y: auto/.test(root), 'the root scrolls');
});

test('short landscape compare (844x390): _renderPanel and _layout keep one row as the root\'s last child; examine stays in the panel', () => {
    for (const setup of ['unnamed', 'named', 'matched']) {
        const g = live(844, 390, true, 'compare', setup);
        g._renderPanel(); g._renderPanel();
        assert.ok(footCount(g) === 1 && place(g) === 'root' && g.root.lastElementChild === foot(g), `${setup}: root's last child`);
        assert.ok(g.panel.querySelector('.dusting-foot') === null, `${setup}: none in the panel`);
    }
    const e = live(844, 390, true, 'examine', 'fresh');
    e._renderPanel();
    assert.ok(footCount(e) === 1 && place(e) === 'panel', 'short examine keeps the panel');
});

test('the row follows resize and step change between short compare, portrait, desktop and short examine', () => {
    const g = live(844, 390, true, 'compare', 'unnamed');
    g._layout(); g._renderPanel();
    assert.ok(place(g) === 'root');
    for (const [w, h, step, want] of [[390, 844, 'compare', 'body'], [844, 390, 'compare', 'root'], [1280, 720, 'compare', 'panel'],
        [844, 390, 'compare', 'root'], [844, 390, 'examine', 'panel'], [844, 390, 'compare', 'root']]) {
        window.innerWidth = w; window.innerHeight = h; g.step = step;
        if (step === 'examine') examineCases.fresh(g); else compareCases.unnamed(g);
        g.root.classList.toggle('dusting-short', h <= 500 && w > h);
        g._renderPanel();
        assert.ok(place(g) === want && footCount(g) === 1, `${w}x${h} ${step}: ${want}`);
        g._layout();
        assert.ok(place(g) === want && footCount(g) === 1, `${w}x${h} ${step} after _layout: ${want}`);
    }
});

test('short compare: a click on the root-level row runs _action once; panel and body clicks are not doubled', () => {
    const g = live(844, 390, true, 'compare', 'unnamed');
    g.addEventListener = (t, ev, fn) => t.addEventListener(ev, fn);
    g.gameState = { isActive: true };
    const calls = [];
    g._action = a => calls.push(a);
    g._renderPanel();
    g._bindPanel();
    const click = el => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, detail: 1 }));
    click(foot(g).querySelector('[data-action="unidentified"]'));
    assert.ok(calls.length === 1 && calls[0] === 'unidentified', `root row once: ${calls.length}`);
    g.panel.insertAdjacentHTML('beforeend', '<button data-action="ref">x</button>');
    click(g.panel.querySelector('[data-action="ref"]'));
    assert.ok(calls.length === 2, `panel click once: ${calls.length}`);
    g._renderPanel();
    click(foot(g).querySelector('[data-action="unidentified"]'));
    assert.ok(calls.length === 3, `after a re-render: ${calls.length}`);
});

test('short compare: _findInPanel, _refocus and the 1 to 9 pick reach the root-level row', () => {
    const g = live(844, 390, true, 'compare', 'named');
    g.gameState = { isActive: true };
    g.candidates = [{ index: 0, label: 'A' }, { index: 1, label: 'B' }];
    g._renderPanel();
    const b = g._findInPanel('[data-action="unidentified"]');
    assert.ok(b !== null && b.parentNode === foot(g) && foot(g).parentNode === g.root, 'found in the root row');
    assert.ok(g._refocus('[data-action="unidentified"]') === true && doc.activeElement === b, 'focus moved to it');
    const picks = [];
    g._chooseRef = (i, viaKey) => picks.push(`${i}:${viaKey}`);
    g._onKeyDown({ key: '2', target: doc.activeElement, preventDefault() {} });
    assert.ok(picks[0] === '1:true', `digit pick with focus in the root row: ${picks[0]}`);
});
