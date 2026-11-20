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
        // keyboard-operable toggle: button role, Enter/Space with preventDefault, no repeat, state kept in aria-expanded
        assert.match(src, /expandToggle\.setAttribute\('role', 'button'\)/, `${f}: role=button`);
        assert.match(src, /expandToggle\.setAttribute\('tabindex', '0'\)/, `${f}: toggle is focusable`);
        assert.match(src, /expandToggle\.setAttribute\('aria-expanded', 'false'\)/, `${f}: starts collapsed`);
        assert.match(src, /expandToggle\.setAttribute\('aria-controls'/, `${f}: aria-controls`);
        const kd = src.slice(src.indexOf("addEventListener(expandToggle, 'keydown'"));
        const handler = kd.slice(0, kd.indexOf('});'));
        assert.match(handler, /if \(e\.repeat\) return;/, `${f}: ignores key repeat`);
        assert.match(handler, /e\.key === 'Enter' \|\| e\.key === ' '/, `${f}: Enter or Space`);
        assert.match(handler, /e\.preventDefault\(\)/, `${f}: preventDefault`);
        const clk = src.slice(src.indexOf("addEventListener(expandToggle, 'click'"));
        const ch = clk.slice(0, clk.indexOf('});'));
        assert.match(ch, /classList\.remove\('expanded'\)[\s\S]*aria-expanded', 'false'/, `${f}: collapse sets false`);
        assert.match(ch, /classList\.add\('expanded'\)[\s\S]*aria-expanded', 'true'/, `${f}: expand sets true`);
    }
});

test('themed focus marker: 2px square outline on :focus-visible only, no radius or blur', () => {
    const rules = rulesOf('ui-themes.css');
    const sels = ['.person-chat-choice-button', '.person-chat-continue-button', '.minigame-button', '.minigame-close-button', '.tutorial-btn', '.tutorial-next', '.tutorial-skip', '.game-menu-item', '.game-menu-close', '.game-menu-reset', '.modal-button', '.player-preferences-modal-content .btn', '#music-widget-panel .mw-btn', '#music-widget-panel .mw-takeover-btn', '.scanner-panel .scan-toggle', '.scanner-panel .scan-button'].map((x) => `[data-ui-theme] ${x}:focus-visible`);
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

test('phone landscape game menu: the scrolling pages box has padding so focus rings are not clipped', () => {
    const src = strip(readFileSync(join(cssDir, 'game-menu.css'), 'utf8'));
    const start = src.indexOf('@media (orientation: landscape) and (max-height: 560px)');
    assert.ok(start >= 0);
    let depth = 0, end = start;
    for (let i = src.indexOf('{', start); i < src.length; i++) {
        if (src[i] === '{') depth++;
        if (src[i] === '}' && --depth === 0) { end = i; break; }
    }
    const block = src.slice(src.indexOf('{', start) + 1, end);
    const r = [...block.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => m[1].trim() === '.game-menu-pages');
    assert.equal(r.length, 1);
    assert.match(r[0][2], /overflow-y:\s*auto/);
    assert.match(r[0][2], /padding:\s*4px/);
});
