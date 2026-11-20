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

test('phone dial label is wide enough for 13 characters of 16px text', () => {
    const w = m[1].match(/width:\s*(\d+)px/);
    assert.ok(w !== null && Number(w[1]) >= 144, 'label width at least 144px, got ' + (w && w[1]));
});

test('the TURN word is kept as the non-colour cue', () => {
    assert.ok(js.includes("' · TURN'") && js.includes("' · SET'"), 'TURN and SET text still set');
});
