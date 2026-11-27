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

test('steppers wrap and keep every step: one shared rule, no scoped duplicate, no nowrap', () => {
    const skin = read('awareness-skin.css');
    assert.match(block(skin, '.aw-steps'), /flex-wrap: wrap/);
    assert.doesNotMatch(skin, /\.aw-steps \{ flex-wrap: nowrap/);
    assert.doesNotMatch(read('episode-runner.css'), /\.aw-steps \{ flex-wrap/);
    assert.match(skin, /Revised 2026-11-18 \(AC1 UI sweep\): steppers wrap at narrow widths so no step is hidden\./);
    const tri = read('inbox-triage-minigame.css');
    assert.doesNotMatch(tri, /\.tri-steps \{[^}]*nowrap/);
    assert.match(tri, /\.tri-steps \{ flex: 1 1 100%; flex-wrap: wrap; \}/);
    assert.doesNotMatch(read('landing-page-builder-minigame.css'), /\.lpb-steps \{ flex-wrap: nowrap/);
});

test('current step has a thicker bottom border, not colour alone, with padding compensating', () => {
    assert.match(read('awareness-skin.css'), /\.aw-step-current \{[^}]*border-bottom-width: 4px; padding-bottom: 1px/);
    assert.match(read('inbox-triage-minigame.css'), /\.tri-step\.current \{ border-bottom-width: 4px; padding-bottom: 2px; \}/);
    assert.match(read('landing-page-builder-minigame.css'), /\.lpb-step\.is-current \{[^}]*border-bottom-width: 4px;\s*padding-bottom: 2px/);
});

test('console titles: one framework rule, 3 lines at 600px and below, per-scene copies gone', () => {
    const fw = read('minigames-framework.css');
    const m = fw.match(/@media \(max-width: 600px\) \{[\s\S]*?\n\}/g).find((x) => /-webkit-line-clamp: 3/.test(x));
    assert.ok(m, 'clamp rule sits in a max-width: 600px block');
    const t = block(m, '.console-window .console-title');
    assert.match(t, /white-space: normal/);
    assert.match(t, /overflow-wrap: break-word/);
    assert.doesNotMatch(t, /anywhere/);
    assert.match(t, /line-clamp: 3/);
    assert.match(t, /line-height: 24px/);
    assert.doesNotMatch(t, /font-size/);
    assert.match(block(m, '.console-titles'), /padding-right: 2px/);
    // the base rule above 600px stays one line
    assert.match(block(fw, '.console-window .console-title'), /white-space: nowrap/);
    for (const f of ['drug-library-integrity-minigame.css', 'log-filter-minigame.css']) {
        assert.doesNotMatch(read(f), /\.console-title\b/, `${f} has no per-scene title rule`);
        assert.doesNotMatch(read(f), /\.console-titles\b/);
    }
});

test('DLI CSS has no blue left; source button is green with focus rings', () => {
    const d = read('drug-library-integrity-minigame.css');
    assert.doesNotMatch(d, /#1f6feb|#58a6ff/i);
    const r = block(d, '.dli-source-btn');
    for (const re of [/padding: 5px 12px/, /border: 2px solid #33cc66/, /border-radius: 0/, /background: #0f2d1a/, /color: #33cc66/, /VT323/, /font-size: 16px/, /white-space: nowrap/]) assert.match(r, re);
    assert.match(d, /\.dli-source-btn:hover:not\(:disabled\) \{ background: #1a4a2a/);
    assert.match(d, /\.dli-modal-confirm-btn:hover \{ background: #1a4a2a/);
    assert.match(d, /\.dli-restore-btn-active:hover \{ background: #1a4a2a/);
    assert.match(d, /\.dli-modal-confirm-btn:focus-visible,\s*\.dli-source-btn:focus-visible,\s*\.dli-restore-btn:focus-visible,\s*\.dli-backup-btn:focus-visible,\s*\.dli-view-log-btn:focus-visible \{\s*outline: 2px solid #33cc66;\s*outline-offset: 2px;/);
    assert.match(d, /\.dli-source-btn:disabled/);
});

test('DLI source-modal confirm uses the pixel-palette confirm look, not blue', () => {
    const r = block(read('drug-library-integrity-minigame.css'), '.dli-modal-confirm-btn');
    assert.doesNotMatch(r, /#1f6feb|#388bfd|border: none/i);
    assert.match(r, /border: 2px solid #33cc66/);
    assert.match(r, /border-radius: 0/);
});

test('done steps have a non-colour cue: a 2px-pixel tick (zero-blur shadows), plus hidden (done) text', () => {
    const skin = read('awareness-skin.css');
    const num = block(skin, '.aw-step-done .aw-step-num::after');
    assert.match(num, /content: ''/);
    assert.match(num, /box-shadow: -12px 4px 0 0 currentColor/);
    assert.doesNotMatch(num, /rotate|gradient|radius/);
    assert.match(block(skin, '.aw-step-done .aw-step-num'), /font-size: 0/);
    assert.doesNotMatch(skin, /\.aw-step-done \.aw-step-num \{[^}]*opacity/);
    assert.match(block(read('inbox-triage-minigame.css'), '.tri-step.done::before'), /box-shadow: -12px 4px 0 0 currentColor/);
    assert.match(block(read('landing-page-builder-minigame.css'), '.lpb-step.is-done::before'), /box-shadow: -12px 4px 0 0 currentColor/);
    const js = (f) => readFileSync(join(css, '../js/minigames', f), 'utf8');
    assert.match(js('episode-runner/step-strip.js'), /srDone: ' \(done\)'/);
    assert.match(js('inbox-triage/inbox-triage-minigame.js'), /doneClass: 'done', srClass: 'tri-step-sr', srDone: ' \(done\)'/);
    assert.match(js('landing-page-builder/landing-page-builder-minigame.js'), /doneClass: 'is-done', srClass: 'lpb-step-sr', srDone: ' \(done\)'/);
});

test('org prefix of a console title is hidden at short heights as well as narrow widths', () => {
    const fw = read('minigames-framework.css');
    const short = fw.match(/@media \(max-height: 500px\) \{[\s\S]*?\n\}/g).find((x) => /console-title-org/.test(x));
    assert.ok(short, 'org hide sits in a max-height: 500px block');
    assert.match(block(short, '.console-window .console-title-org'), /display: none/);
    const narrow = fw.match(/@media \(max-width: 600px\) \{[\s\S]*?\n\}/g).find((x) => /console-title-org/.test(x));
    assert.ok(narrow, 'still hidden at 600px wide');
    // 844x390: title area 766 - 34 = 732px = 45 Press Start 2P characters at 16px; the longest
    // remainders (JUMP SERVER ACCESS LOG (JS-ALBION-01), 37; CLINICAL RECOVERY CONSOLE, 25) fit on one line.
    assert.ok(Math.floor(732 / 16) >= 'JUMP SERVER ACCESS LOG (JS-ALBION-01)'.length);
});
