// B7: at phone width the dial label ("DIAL 1 · TURN") stays on one line so the three dial
// rows keep an equal pitch, and the word stays (TURN/SET tells the dials apart without colour).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '../../public/break_escape/css/combination-minigame.css'), 'utf8');
const js = readFileSync(join(here, '../../public/break_escape/js/minigames/combination/combination-minigame.js'), 'utf8');

const start = css.indexOf('@media (max-width: 600px)');
const block = css.slice(start);
const m = block.match(/\.combination-dial-label\s*\{([^}]*)\}/);

test('phone dial label rule exists', () => {
    assert.ok(start >= 0 && m !== null, 'a .combination-dial-label rule in the 600px block');
});

test('phone dial label never wraps', () => {
    assert.ok(/white-space:\s*nowrap/.test(m[1]), 'white-space: nowrap');
});

// The label is VT323 (inherited): 400/1000 em advance plus 0.06em spacing, 16px
const need = Math.ceil(13 * (0.4 + 0.06) * 16);

test('phone dial label is wide enough for 13 characters of 16px VT323', () => {
    const w = m[1].match(/width:\s*(\d+)px/);
    assert.ok(w !== null && Number(w[1]) >= need, 'label width at least ' + need + 'px, got ' + (w && w[1]));
});

test('the dial row fits a 360px screen in the widest frame theme (24px and 28px)', () => {
    const num = (re, src) => Number(src.match(re)[1]);
    const label = num(/width:\s*(\d+)px/, m[1]);
    const gap = num(/\.combination-dial-group\s*\{[^}]*gap:\s*(\d+)px/, block);
    const display = num(/\.combination-dial-display\s*\{[^}]*?\bwidth:\s*(\d+)px/, block);
    const arrow = num(/\.combination-dial-arrow\s*\{[^}]*?\bwidth:\s*(\d+)px/, css);
    const pad = num(/\.combination-dials\s*\{[^}]*padding:\s*\d+px\s+(\d+)px/, block);
    // The display is content-box: add its side padding and 2px borders (live: 100px when padded 8px)
    const dispRule = block.match(/\.combination-dial-display\s*\{([^}]*)\}/)[1];
    const padX = (() => { const p = dispRule.match(/padding:\s*(\d+)(?:px)?(?:\s+(\d+)(?:px)?)?/); return p ? Number(p[2] ?? p[1]) : 0; })();
    const row = label + (display + 2 * padX + 4) + 2 * arrow + 3 * gap;
    const themes = readFileSync(join(here, '../../public/break_escape/css/ui-themes.css'), 'utf8');
    const frames = [...themes.matchAll(/--ui-frame-px:\s*(\d+)px/g)].map(x => Number(x[1]));
    for (const f of [24, 28]) assert.ok(frames.includes(f), 'a ' + f + 'px theme exists');
    const widest = Math.max(...frames);
    const room = 360 - 2 * widest - 2 * pad;
    // Keep 4px spare (live at 360 cyberpunk: the padded 300px row spilled into the dials' padding)
    assert.ok(row + 4 <= room, 'row ' + row + 'px fits ' + room + 'px with 4px spare (frame ' + widest + 'px)');
});

test('the TURN word is kept as the non-colour cue', () => {
    assert.ok(js.includes("' · TURN'") && js.includes("' · SET'"), 'TURN and SET text still set');
});
