// K10 B: the pixel "SCROLL >" cue for wide tables on phones.
// Run with: node --test test/js/scroll-cue.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const { shouldShowScrollCue, attachScrollCue } = await import(pathToFileURL(join(js, 'utils/scroll-cue.js')).href);

const base = { isPhone: true, scrollLeft: 0, clientWidth: 300, scrollWidth: 600 };

test('shows on a phone while more columns lie to the right', () => {
    assert.ok(shouldShowScrollCue(base) === true, 'shown at the start');
    assert.ok(shouldShowScrollCue({ ...base, scrollLeft: 150 }) === true, 'shown mid-scroll');
});

test('hides at the scroll end, when nothing overflows, and off phones', () => {
    assert.ok(shouldShowScrollCue({ ...base, scrollLeft: 300 }) === false, 'hidden at the end');
    assert.ok(shouldShowScrollCue({ ...base, scrollLeft: 299 }) === false, 'sub-pixel slack counts as the end');
    assert.ok(shouldShowScrollCue({ ...base, scrollWidth: 300 }) === false, 'no overflow');
    assert.ok(shouldShowScrollCue({ ...base, isPhone: false }) === false, 'not a phone');
});

function fakeWorld(phone) {
    const listeners = { scroller: {}, win: {} };
    const cue = { style: {}, removed: false, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, remove() { this.removed = true; } };
    const host = { inserted: [], clientWidth: 400, style: {}, insertBefore(c, ref) { this.inserted.push([c, ref]); } };
    const scroller = {
        parentElement: host, scrollLeft: 0, clientWidth: 300, scrollWidth: 600, offsetWidth: 300, offsetLeft: 0, offsetTop: 20,
        addEventListener(t, f) { listeners.scroller[t] = f; }, removeEventListener(t) { delete listeners.scroller[t]; }
    };
    const win = {
        matchMedia: () => ({ matches: phone.value }),
        getComputedStyle: () => ({ position: 'static' }),
        addEventListener(t, f) { listeners.win[t] = f; }, removeEventListener(t) { delete listeners.win[t]; }
    };
    const doc = { createElement: () => cue };
    return { listeners, cue, host, scroller, win, doc };
}

test('cue text is "SCROLL >", set by textContent, with a 2px border and pixel font', () => {
    const w = fakeWorld({ value: true });
    attachScrollCue(w.scroller, { window: w.win, document: w.doc });
    assert.ok(w.cue.textContent === 'SCROLL >', 'text');
    assert.ok(w.cue.style.border === '2px solid #ffffff', 'border');
    assert.ok(/VT323/.test(w.cue.style.fontFamily), 'pixel font');
    assert.ok(w.host.inserted[0][0] === w.cue && w.host.inserted[0][1] === w.scroller, 'placed in flow, directly before the scroller');
    assert.ok(w.cue.style.position === undefined, 'not absolutely positioned');
    assert.ok(w.cue.style.marginLeft === 'auto', 'right aligned on its own line');
});

test('cue is visible with more columns, hidden-but-space-keeping at the end, display none with no overflow', () => {
    const phone = { value: true };
    const w = fakeWorld(phone);
    const h = attachScrollCue(w.scroller, { window: w.win, document: w.doc });
    assert.ok(w.cue.style.display === 'block' && w.cue.style.visibility === 'visible', 'visible at start');
    w.scroller.scrollLeft = 300; w.listeners.scroller.scroll();
    assert.ok(w.cue.style.display === 'block' && w.cue.style.visibility === 'hidden', 'at the end: visibility hidden, still takes its line');
    w.scroller.scrollLeft = 0; w.scroller.scrollWidth = 300; w.listeners.win.resize();
    assert.ok(w.cue.style.display === 'none', 'no overflow: display none, no space');
    w.scroller.scrollWidth = 700; phone.value = false; w.listeners.win.resize();
    assert.ok(w.cue.style.display === 'none', 'desktop width: display none');
    phone.value = true; w.listeners.win.resize();
    assert.ok(w.cue.style.display === 'block' && w.cue.style.visibility === 'visible', 'back on a phone with overflow');
    h.destroy();
    assert.ok(w.cue.removed === true, 'cue removed');
    assert.ok(!w.listeners.scroller.scroll && !w.listeners.win.resize, 'listeners removed');
});

test('both minigames use the shared helper', () => {
    for (const rel of ['minigames/log-filter/log-filter-minigame.js', 'minigames/drug-library-integrity/drug-library-integrity-minigame.js']) {
        const src = readFileSync(join(js, rel), 'utf8');
        assert.ok(/import \{ attachScrollCue \} from '\.\.\/\.\.\/utils\/scroll-cue\.js';/.test(src), `${rel} imports it`);
        assert.ok(/attachScrollCue\(/.test(src), `${rel} attaches it`);
    }
});

test('paired panels: when either overflows, both cues take their line so headers stay level', () => {
    const phone = { value: true };
    const a = fakeWorld(phone);
    const b = fakeWorld(phone);
    b.scroller.scrollWidth = 300; // the right panel does not overflow
    const group = [];
    attachScrollCue(a.scroller, { window: a.win, document: a.doc, group });
    attachScrollCue(b.scroller, { window: b.win, document: b.doc, group });
    a.listeners.win.resize(); b.listeners.win.resize();
    assert.ok(a.cue.style.display === 'block' && a.cue.style.visibility === 'visible', 'overflowing panel: cue shown');
    assert.ok(b.cue.style.display === 'block', 'non-overflowing partner still takes the line');
    assert.ok(b.cue.style.visibility === 'hidden', 'but is invisible');
    a.scroller.scrollWidth = 300; a.listeners.win.resize(); b.listeners.win.resize();
    assert.ok(a.cue.style.display === 'none' && b.cue.style.display === 'none', 'neither overflows: no space for either');
});

test('without a group a non-overflowing cue stays display none', () => {
    const w = fakeWorld({ value: true });
    w.scroller.scrollWidth = 300;
    attachScrollCue(w.scroller, { window: w.win, document: w.doc });
    assert.ok(w.cue.style.display === 'none', 'no overflow, no group: no space');
});

test('insetToPadding aligns the cue with the scroller padding', () => {
    const w = fakeWorld({ value: true });
    w.win.getComputedStyle = () => ({ paddingRight: '16px' });
    attachScrollCue(w.scroller, { window: w.win, document: w.doc, insetToPadding: true });
    assert.ok(w.cue.style.marginRight === '16px', 'right margin equals the padding');
    const v = fakeWorld({ value: true });
    attachScrollCue(v.scroller, { window: v.win, document: v.doc });
    assert.ok(v.cue.style.marginRight === undefined, 'no inset unless asked');
});
