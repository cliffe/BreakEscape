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
    const host = { appended: [], clientWidth: 400, style: {}, appendChild(c) { this.appended.push(c); } };
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
    assert.ok(w.host.appended[0] === w.cue, 'added beside the scroller');
});

test('cue updates on scroll and resize, and is removed on destroy', () => {
    const phone = { value: true };
    const w = fakeWorld(phone);
    const h = attachScrollCue(w.scroller, { window: w.win, document: w.doc });
    assert.ok(w.cue.style.display === 'block', 'visible at start');
    assert.ok(w.cue.style.top === '24px', 'aligned to the scroller top');
    w.scroller.scrollLeft = 300; w.listeners.scroller.scroll();
    assert.ok(w.cue.style.display === 'none', 'hidden at the end after scroll');
    w.scroller.scrollLeft = 0; w.scroller.scrollWidth = 300; w.listeners.win.resize();
    assert.ok(w.cue.style.display === 'none', 'hidden after a resize removes the overflow');
    w.scroller.scrollWidth = 700; phone.value = false; w.listeners.win.resize();
    assert.ok(w.cue.style.display === 'none', 'hidden after growing to a desktop width');
    phone.value = true; w.listeners.win.resize();
    assert.ok(w.cue.style.display === 'block', 'back on a phone with overflow');
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
