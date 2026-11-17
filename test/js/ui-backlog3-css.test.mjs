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
    const r = rulesFor(rulesOf('scanner-panel.css'), '.scanner-panel:has(.scan-toggle) .biometrics-search-room-container');
    assert.equal(r.length, 1);
    assert.match(r[0].body, /margin-left:\s*32px/);
    const hdr = rulesFor(rulesOf('scanner-panel.css'), '.scanner-panel:has(.scan-toggle) .scan-header');
    assert.match(hdr[0].body, /margin-left:\s*32px/);
});

test('themed focus marker: 2px square outline on :focus-visible only, no radius or blur', () => {
    const rules = rulesOf('ui-themes.css');
    for (const sel of ['[data-ui-theme] .person-chat-choice-button:focus-visible', '[data-ui-theme] .person-chat-continue-button:focus-visible', '[data-ui-theme] .minigame-button:focus-visible', '[data-ui-theme] .minigame-close-button:focus-visible']) {
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
