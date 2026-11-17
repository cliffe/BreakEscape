// UI backlog 3: scanner toggle clear of the biometrics search row, and a non-colour keyboard
// focus marker (2px square outline, :focus-visible only) in the themed and default person chat.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cssDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public/break_escape/css');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const rulesOf = (f) => [...strip(readFileSync(join(cssDir, f), 'utf8')).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));
const rulesFor = (rules, needle) => rules.filter((r) => r.sel.split(',').map((x) => x.trim()).includes(needle));

test('biometrics search row takes the header side margin so the toggle never overlaps it', () => {
    // class selector (works without :has()) and the :has() twin in its own rule
    for (const lead of ['.scanner-panel.has-scan-toggle', '.scanner-panel:has(.scan-toggle)']) {
        for (const tail of ['.biometrics-search-room-container', '.scan-header']) {
            const r = rulesFor(rulesOf('scanner-panel.css'), `${lead} ${tail}`);
            assert.equal(r.length, 1, `${lead} ${tail}`);
            assert.match(r[0].body, /margin-left:\s*32px/);
            assert.equal(r[0].sel.includes(','), false, 'not in a list with an :has() selector');
        }
    }
});

test('the has-scan-toggle class is added where the toggle is made (biometrics, bluetooth)', () => {
    const js = join(cssDir, '..', 'js', 'minigames');
    for (const f of ['biometrics/biometrics-minigame.js', 'bluetooth/bluetooth-scanner-minigame.js']) {
        const src = readFileSync(join(js, f), 'utf8');
        const at = src.indexOf("classList.add('has-scan-toggle')");
        assert.ok(at >= 0, f);
        assert.ok(at < src.indexOf("className = '", src.indexOf('expandToggle = document.createElement')) + 200, `${f}: before/at toggle creation`);
        assert.match(src, /expandToggle\.setAttribute\('tabindex', '0'\)/, `${f}: toggle is focusable`);
    }
});

test('themed focus marker: 2px square outline on :focus-visible only, no radius or blur', () => {
    const rules = rulesOf('ui-themes.css');
    const sels = ['.person-chat-choice-button', '.person-chat-continue-button', '.minigame-button', '.minigame-close-button', '.tutorial-btn', '.tutorial-next', '.tutorial-skip', '.game-menu-item', '.game-menu-close', '.game-menu-reset', '.modal-button', '.password-modal-button', '#password-modal-ok', '#password-modal-cancel', '.player-preferences-modal-content .btn', '#music-widget-panel .mw-btn', '#music-widget-panel .mw-takeover-btn', '.scanner-panel .scan-toggle', '.scanner-panel .scan-button'].map((x) => `[data-ui-theme] ${x}:focus-visible`);
    for (const sel of sels) {
        const r = rulesFor(rules, sel);
        assert.ok(r.length, sel);
        const b = r.map((x) => x.body).join(';');
        assert.match(b, /outline:\s*2px solid var\(--ui-accent\)/);
        assert.match(b, /outline-offset:\s*2px/);
        assert.match(b, /border-radius:\s*0/);
        assert.doesNotMatch(b, /blur|box-shadow/);
    }
    // every theme defines the accent the marker uses
    const css = strip(readFileSync(join(cssDir, 'ui-themes.css'), 'utf8'));
    const themes = [...css.matchAll(/^\[data-ui-theme="(\w+)"\]\s*\{([^}]*)\}/gm)];
    assert.ok(themes.length >= 7);
    for (const [, name, body] of themes) assert.match(body, /--ui-accent:/, name);
});

test('default (unthemed) person chat choices and continue get the same outline, after their :focus rules', () => {
    const css = strip(readFileSync(join(cssDir, 'person-chat-minigame.css'), 'utf8'));
    for (const c of ['choice', 'continue']) {
        const fv = css.indexOf(`.person-chat-${c}-button:focus-visible`);
        assert.ok(fv > css.indexOf(`.person-chat-${c}-button:focus {`), `${c} focus-visible follows :focus`);
        assert.match(css.slice(fv, fv + 120), /outline:\s*2px solid #ffffff/);
    }
});

test('tutorial buttons show their own ring on :focus-visible only (a mouse click shows none)', () => {
    const css = strip(readFileSync(join(cssDir, 'tutorial.css'), 'utf8'));
    assert.match(css, /\.tutorial-btn:focus-visible,\s*\.tutorial-next:focus-visible,\s*\.tutorial-skip:focus-visible\s*\{/);
    assert.doesNotMatch(css, /\.tutorial-(btn|next|skip)(-secondary)?:focus\s*[,{]/);
});
