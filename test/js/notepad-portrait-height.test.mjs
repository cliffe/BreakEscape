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
    assert.ok(has(r.width, '88vw'), 'narrower than 92vw so the X stays inside the notepad');
    assert.ok(has(r.width, '165 / 205'), 'the height budget turns into a width at the image shape');
    assert.ok(has(r.width, '100dvh - 176px'), 'dynamic viewport height on phones');
    const g = rule(notes, '.minigame-container .notes-minigame-game-container', PORTRAIT);
    assert.equal(g.height, 'auto', 'beats the framework height: 100% (linked after notes.css) so no empty band');
    assert.equal(rules(notes, '.notes-minigame-notepad', PORTRAIT).some(x => x.height), false, 'no portrait height, so no stretch');
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
    assert.match(area.height, /calc\(90% - 48px\)/);
    const js = readFileSync(join(root, 'js/minigames/notes/notes-minigame.js'), 'utf8');
    assert.match(js, /notes-minigame-content-area pixel-scroll/, 'visible pixel scrollbar');
    assert.match(js, /moreCue\.className = 'notes-minigame-more'/);
    assert.match(js, /moreCue\.textContent = 'MORE /, 'text via textContent');
    const cue = rule(notes, '.notes-minigame-more');
    assert.equal(cue['font-size'], '8px');
    assert.equal(cue['pointer-events'], 'none');
    assert.match(cue['font-family'], /Press Start 2P/);
});

test('short landscape (phone on its side) keeps its own sizing at the true 165:205 shape', () => {
    const r = rules(notes, '.notes-minigame-notepad', 'orientation: landscape) and (max-height: 640px)')[0];
    assert.equal(r.height, 'calc(100vh - 12px)');
    assert.equal(r.width, 'calc((100vh - 12px) * 165 / 205)');
    assert.equal(r['aspect-ratio'], 'auto');
});

test('the edit pencil has room: the observation box reserves its right side', () => {
    const base = rule(notes, '.notes-minigame-observation');
    assert.equal(base['padding-right'], '28px');
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
