// Phone fit fixes: kiosk step tabs wrap whole, DLI and log-filter console titles wrap beside the X,
// DLI source-modal confirm is not the old blue. Reads the stylesheet text.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const css = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/css');
const read = (f) => readFileSync(join(css, f), 'utf8');
const block = (s, sel) => {
    const i = s.indexOf(sel + ' {');
    assert.ok(i >= 0, `rule ${sel} exists`);
    return s.slice(i, s.indexOf('}', i));
};

test('episode-runner step tabs wrap instead of scrolling and clipping (kiosk at 390)', () => {
    const r = block(read('episode-runner.css'), '.minigame-container[data-minigame="episode-runner"] .aw-steps');
    assert.match(r, /flex-wrap: wrap/);
    assert.match(r, /overflow-x: visible/);
    // the shared strip is untouched for the other steppers
    assert.match(read('awareness-skin.css'), /@media \(max-width: 767px\) \{\s*\.aw-steps \{ flex-wrap: nowrap; overflow-x: auto; \}/);
});

for (const [file, key] of [['drug-library-integrity-minigame.css', 'drug-library-integrity'], ['log-filter-minigame.css', 'log-filter']]) {
    test(`${key} console title wraps (two lines max) and stays clear of the X`, () => {
        const s = read(file);
        const t = block(s, `.minigame-container[data-minigame="${key}"] .console-window .console-title`);
        assert.match(t, /white-space: normal/);
        assert.match(t, /-webkit-line-clamp: 2/);
        assert.doesNotMatch(t, /font-size/);   // stays the framework's 16px pixel size
        assert.match(block(s, `.minigame-container[data-minigame="${key}"] .console-titles`), /padding-right: 8px/);
    });
}

test('DLI source-modal confirm uses the pixel-palette confirm look, not blue', () => {
    const r = block(read('drug-library-integrity-minigame.css'), '.dli-modal-confirm-btn');
    assert.doesNotMatch(r, /#1f6feb|#388bfd|border: none/i);
    assert.match(r, /border: 2px solid #33cc66/);
    assert.match(r, /border-radius: 0/);
    assert.doesNotMatch(read('drug-library-integrity-minigame.css'), /\.dli-modal-confirm-btn:hover \{ background: #388bfd/);
});
