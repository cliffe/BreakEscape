// The notes notepad on a portrait phone uses the height the shell leaves (it was sized from
// the width alone: 358x445 on a 390x844 screen, page cut off, 400px of empty shell below).
// CSS only, read as text. Run with: node --test test/js/notepad-portrait-height.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape');
const notes = readFileSync(join(root, 'css', 'notes.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

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
const has = (v, want) => [].concat(v || []).some(x => String(x).includes(want));
const PORTRAIT = '(orientation: portrait) and (max-width: 768px)';

test('base notepad is still scaled from the width with the image aspect (desktop unchanged)', () => {
    const r = rule(notes, '.notes-minigame-notepad');
    assert.match(r.width, /min\(92vw, \(100vh - 176px\) \* 165 \/ 205\)/);
    assert.equal(r['aspect-ratio'], '165 / 205');
});

test('portrait phones: the notepad keeps the image shape and the container wraps it (no stretch)', () => {
    const r = rule(notes, '.notes-minigame-notepad', PORTRAIT);
    assert.equal(r['aspect-ratio'], '165 / 205', 'true image shape, no non-uniform stretch');
    assert.equal(r['background-size'], undefined, 'no 100% 100% stretch in portrait');
    assert.ok(has(r.width, '92vw'), 'the larger page; the X is anchored to the paper edge, so it fits');
    assert.ok(has(r.width, '165 / 205'), 'the height budget turns into a width at the image shape');
    assert.ok(has(r.width, '100dvh - 176px'), 'dynamic viewport height on phones');
    const g = rule(notes, '.minigame-container .notes-minigame-game-container', PORTRAIT);
    assert.equal(g.height, 'auto', 'beats the framework height: 100% (linked after notes.css) so no empty band');
    assert.equal(rules(notes, '.notes-minigame-notepad', PORTRAIT).some(x => x.height), false, 'no portrait height, so no stretch');
    assert.equal(g.padding, '8px 0', 'no side padding: the notepad sits centred');
    assert.equal(g.background, 'transparent', 'no #1a1a1a band from the framework');
});

test('no rule slices or stretches the notepad non-uniformly (the art has per-ring detail, so no 3-slice)', () => {
    assert.doesNotMatch(notes, /border-image/);
    for (const m of notes.matchAll(/\.notes-minigame-notepad \{([^}]*)\}/g)) {
        const body = m[1];
        if (!/100% 100%/.test(body)) continue;
        // allowed only where width and height are the same figure at 165:205
        const h = body.match(/height: calc\(([^;]*?)\);/)[1];
        const w = body.match(/width: calc\(\(([^;]*?)\) \* 165 \/ 205\);/)[1];
        assert.equal(w, h, 'box is exactly 165:205, so 100% 100% is a uniform scale');
    }
});

test('portrait: the page body scrolls inside the notepad with a scrollbar and a MORE cue', () => {
    const area = rule(notes, '.notes-minigame-content-area');
    assert.equal(area.overflow, 'auto');
    assert.match(area.height, /calc\(85% - 48px\)/);
    const p = rule(notes, '.notes-minigame-notepad .notes-minigame-content-area', PORTRAIT);
    assert.match(p.height, /calc\(85% - 48px\)/, 'the body stops above the cue');
    const js = readFileSync(join(root, 'js/minigames/notes/notes-minigame.js'), 'utf8');
    assert.match(js, /notes-minigame-content-area pixel-scroll/, 'visible pixel scrollbar');
    assert.match(js, /moreCue\.className = 'notes-minigame-more'/);
    assert.match(js, /moreCue\.textContent = 'MORE /, 'text via textContent');
    const cue = rule(notes, '.notes-minigame-more');
    assert.equal(cue['font-size'], '16px');
    assert.equal(cue['line-height'], '24px');
    assert.equal(cue['pointer-events'], 'none');
    assert.match(cue['font-family'], /Press Start 2P/, 'has U+25BC; GNF does not');
    assert.equal(cue.bottom, 'calc(100% * 14 / 205)', 'in the paper-foot margin (paper ends at art row 190)');
});

test('the MORE cue is kept in sync: pure moreBelow, scroll and observers, new pages at the top', async () => {
    const js = readFileSync(join(root, 'js/minigames/notes/notes-minigame.js'), 'utf8');
    const fn = js.match(/export function moreBelow[\s\S]*?\n\}\n/)[0];
    const { moreBelow } = await import('data:text/javascript,' + encodeURIComponent(fn));
    assert.equal(moreBelow(400, 400), false, 'fits');
    assert.equal(moreBelow(402, 400), false, 'within 2px of the end');
    assert.equal(moreBelow(900, 400), true, 'text below');
    const upd = js.slice(js.indexOf('    updateDisplayedNote() {'), js.indexOf('    parseNoteText('));
    assert.match(upd, /this\._contentArea\.scrollTop = 0;\s*this\._syncMore\(\);\s*\}\s*$/, 'a new page opens at the top and syncs the cue');
    assert.match(js, /this\.addEventListener\(contentArea, 'scroll', \(\) => this\._syncMore\(\)/);
    assert.match(js, /this\._moreObserver = new window\.ResizeObserver/);
    assert.match(js, /\[contentArea, textBox, contentArea\.querySelector\('\.notes-minigame-observation-container'\)\]/);
    assert.match(js, /cleanup\(\) \{\s*this\._moreObserver\?\.disconnect\?\.\(\);/);
    const search = js.slice(js.indexOf('    searchNotes('), js.indexOf('    updateCounter('));
    assert.equal((search.match(/this\.updateDisplayedNote\(\)/g) || []).length, 2, 'search goes through updateDisplayedNote');
});

test('the X is anchored to the paper edge (art paper ends at column 154 of 165)', () => {
    const e = rule(notes, '.notes-minigame-page-edge');
    assert.equal(e.right, 'calc(100% * 10 / 165)');
    assert.equal(e['pointer-events'], 'none');
    const js = readFileSync(join(root, 'js/minigames/notes/notes-minigame.js'), 'utf8');
    assert.match(js, /pageEdge\.className = 'notes-minigame-page-edge'/);
});

test('short landscape (phone on its side) keeps its own sizing at the true 165:205 shape', () => {
    const r = rules(notes, '.notes-minigame-notepad', 'orientation: landscape) and (max-height: 640px)')[0];
    assert.equal(r.height, 'calc(100vh - 12px)');
    assert.equal(r.width, 'calc((100vh - 12px) * 165 / 205)');
    assert.equal(r['aspect-ratio'], 'auto');
});

test('short landscape: 16px MORE cue and an 85% body', () => {
    const L = 'orientation: landscape) and (max-height: 640px)';
    const cue = rule(notes, '.notes-minigame-more', L);
    assert.equal(cue['font-size'], '16px');
    assert.equal(cue['line-height'], '16px');
    assert.match(rule(notes, '.notes-minigame-content-area', L).height, /calc\(85% - 48px\)/);
});

test('the body stops above the MORE cue at every notepad height (clear for H >= 343; 320x568 gives 366)', () => {
    const PORT = '(orientation: portrait) and (max-width: 768px)';
    const LAND = 'orientation: landscape) and (max-height: 640px)';
    const px = (v) => parseFloat(v);
    const baseTop = px(rule(notes, '.notes-minigame-content-area').top);
    assert.equal(baseTop, 48);
    const cases = [
        ['portrait', PORT, '.notes-minigame-notepad .notes-minigame-content-area', 28, [344, 366, 384, 412, 446]],
        ['landscape', LAND, '.notes-minigame-content-area', 20, [276, 312, 378]],
        ['desktop', null, '.notes-minigame-content-area', 28, [559, 592, 904]],
    ];
    for (const [name, media, sel, box, heights] of cases) {
        const c = Object.assign({}, rule(notes, '.notes-minigame-more'), ...(media ? rules(notes, '.notes-minigame-more', media) : []));
        const border = px((c.border || '0').split(' ')[0]) || 0;
        const padV = px(String(c.padding).split(/\s+/)[0]) || 0;
        assert.equal(px(c['line-height']) + padV * 2 + 2 * border, box, `${name} cue box height`);
        const m = c.bottom.match(/100% \* (\d+) \/ (\d+)/);
        const anchor = 1 - Number(m[1]) / Number(m[2]);
        const h = Object.assign({}, rule(notes, '.notes-minigame-content-area'), ...(media ? rules(notes, sel, media) : [])).height;
        const hm = h.match(/calc\((\d+)% - (\d+)px\)/);
        assert.equal(Number(hm[2]), baseTop, `${name}: calc offset equals the content area top`);
        const f = Number(hm[1]) / 100;
        for (const H of heights) {
            const bodyBottom = H * f;
            const cueTop = H * anchor - box;
            assert.ok(bodyBottom <= cueTop, `${name} H=${H}: body bottom ${bodyBottom} vs cue top ${cueTop}`);
        }
    }
});

test('the edit pencil has room: the observation box reserves its right side', () => {
    const base = rule(notes, '.notes-minigame-observation');
    assert.equal(base['padding-right'], '28px');
    assert.equal(base['overflow-wrap'], 'anywhere');
    const land = rule(notes, '.notes-minigame-observation', 'orientation: landscape) and (max-height: 640px)');
    assert.match(land.padding, /^6px 28px 6px 6px$/);
    const btn = rule(notes, '.notes-minigame-edit-btn');
    assert.equal(btn.width, '32px');
    assert.equal(btn.right, '-8px', 'the button covers 24px inside the box edge, under the 28px reserve');
});

test('pixel-art rules hold in the notes sheet: no radius, blur or gradient', () => {
    assert.doesNotMatch(notes, /border-radius/);
    assert.doesNotMatch(notes, /gradient\(/);
    assert.doesNotMatch(notes, /blur\(/);
});

// ---- Second round: the cue ignores blank paper; the pencil survives page changes ----
test('moreBelow compares the last content with the visible bottom, not the scroll height', async () => {
    const js = readFileSync(join(root, 'js/minigames/notes/notes-minigame.js'), 'utf8');
    const fn = js.match(/export function moreBelow[\s\S]*?\n\}\n/)[0];
    const { moreBelow } = await import('data:text/javascript,' + encodeURIComponent(fn));
    assert.equal(moreBelow(300, 300), false, 'last box ends at the visible bottom');
    assert.equal(moreBelow(301.5, 300), false, 'within the 2px tolerance');
    assert.equal(moreBelow(303, 300), true, 'real overflow');
});

test('JSDOM: padding/margin-only overflow gives no cue, real overflow does, the pencil opens the editor after page changes', async () => {
    const { JSDOM } = await import('jsdom');
    for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};
    const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.window.gameState = { notes: [] };
    const { pathToFileURL } = await import('node:url');
    const { NotesMinigame } = await import(pathToFileURL(join(root, 'js/minigames/notes/notes-minigame.js')).href);
    const m = Object.create(NotesMinigame.prototype);
    m.container = document.createElement('div');
    m.container.innerHTML = '<div class="notes-minigame-title"></div><div class="notes-minigame-text"></div>'
        + '<div class="notes-minigame-observation-container"><div class="notes-minigame-observation"></div>'
        + '<button class="notes-minigame-edit-btn"></button></div>';
    const area = document.createElement('div');
    m.container.append(area);
    m._contentArea = area;
    const cue = { hidden: true };
    m._moreCue = cue;
    const last = document.createElement('div');
    area.appendChild(last);
    const rect = (b) => ({ bottom: b, top: 0, left: 0, right: 0, width: 0, height: 0 });
    area.getBoundingClientRect = () => rect(400);
    // Area bottom 400. Last box ends at 390 (inside the padding) although scrollHeight would be 420.
    last.getBoundingClientRect = () => rect(390);
    Object.defineProperty(area, 'scrollHeight', { value: 420 });
    Object.defineProperty(area, 'clientHeight', { value: 400 });
    m._syncMore();
    assert.equal(cue.hidden, true, 'only padding/margin below: no cue');
    last.getBoundingClientRect = () => rect(430);
    m._syncMore();
    assert.equal(cue.hidden, false, 'content below the visible bottom: cue');

    // Pencil: wire it as init does (the handler resolves the observation at click time)
    const js = readFileSync(join(root, 'js/minigames/notes/notes-minigame.js'), 'utf8');
    assert.doesNotMatch(js, /editBtn\.addEventListener\('click', \(\) => this\.editObservations\(observationDiv\)\)/,
        'the pencil must not hold the first observation div');
    assert.match(js, /editBtn\.addEventListener\('click', \(\) => this\.editObservations\(observationContainer\.querySelector/);
    m.params = {};
    m.item = {};
    m.showsFiledPage = false;
    m.collectedNotes = [{ title: 'A', text: 'one\n\nObservation: o1' }, { title: 'B', text: 'two' }, { title: 'C', text: 'three\n\nObservation: o3' }];
    m.currentNoteIndex = 0;
    const calls = [];
    m.editObservations = (div) => calls.push(div);
    const box = m.container.querySelector('.notes-minigame-observation-container');
    const btn = box.querySelector('.notes-minigame-edit-btn');
    btn.addEventListener('click', () => m.editObservations(box.querySelector('.notes-minigame-observation')));
    for (const i of [1, 2]) { m.currentNoteIndex = i; m.updateDisplayedNote(); }
    btn.click();
    assert.equal(calls.length, 1);
    assert.ok(m.container.contains(calls[0]), 'the editor opens on the observation now on the page');
    assert.equal(calls[0].textContent, 'o3');
    assert.equal(btn.getAttribute('aria-label'), 'Edit observations', 'accessible name');
});
