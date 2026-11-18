// Sweep fixes B1/A4 (close X hit area), B3 (dusting key radius), A3 (phone header gap),
// A7 (vm-launcher GNF sizes), A9 (vm-launcher max-height). Reads the stylesheet text.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const css = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/css');
const read = (f) => readFileSync(join(css, f), 'utf8');
const rule = (s, sel) => {
    const i = s.indexOf(sel + ' {');
    assert.ok(i >= 0, `rule ${sel} exists`);
    return s.slice(i, s.indexOf('}', i));
};

test('every minigame close X has a 44px hit area at every size (B1, A4)', () => {
    const s = read('minigames-framework.css');
    const r = rule(s, '.minigame-close-button::after');
    assert.match(r, /position: absolute/);
    assert.match(r, /inset: -14px/);
    // not scoped to person-chat or to a width-only query
    assert.doesNotMatch(s, /\[data-minigame="person-chat"\] \.minigame-close-button::after/);
    // the drawn size is unchanged
    assert.match(rule(s, '.minigame-close-button'), /width: 30px;\s*height: 30px/);
    // the in-flow console X must anchor the pseudo-element
    assert.match(rule(s, '.console-titlebar > .minigame-close-button'), /position: relative/);
});

test('no minigame close rule resizes below the hit area or removes it (B1)', () => {
    for (const f of ['ui-themes.css', 'password-minigame.css', 'pc-monitor.css', 'shredded-document-minigame.css', 'dusting.css']) {
        assert.doesNotMatch(read(f), /minigame-close-button[^{]*::after\s*\{[^}]*(content:\s*none|display:\s*none)/, f);
    }
});

test('dusting key-end marker has no border-radius (B3)', () => {
    const s = read('dusting.css');
    const line = s.split('\n').find((l) => l.startsWith('.dusting-key-end {'));
    assert.ok(line, 'rule present');
    assert.doesNotMatch(line, /border-radius/);
    assert.match(line, /clip-path: polygon/);
    assert.doesNotMatch(s, /\.dusting-key-end[^{]*\{[^}]*border-radius/);
});

test('phone status bar keeps the battery clear of the Notepad button (A3)', () => {
    assert.match(rule(read('phone-chat-minigame.css'), '.phone-header'), /gap: 12px/);
});

test('vm-launcher uses 16px GNF and a viewport-relative max-height (A7, A9)', () => {
    const s = read('vm-launcher-minigame.css');
    assert.doesNotMatch(s, /font-size: (12|13|14)px/);
    const r = rule(s, '.vm-launcher');
    assert.match(r, /max-height: min\(400px, calc\(100vh - \d+px\)\)/);
    assert.doesNotMatch(r, /max-height: 400px/);
});
