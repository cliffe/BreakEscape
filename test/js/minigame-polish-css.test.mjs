// Sweep fixes B1/A4 (close X hit area), B3 (dusting key radius), A3 (phone header gap),
// A7 (vm-launcher GNF sizes), A9 (vm-launcher max-height). Reads the stylesheet text.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, readdirSync } from "node:fs";

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
    assert.match(r, /max-height: min\(400px, calc\(100dvh - \d+px\)\)/);
    assert.doesNotMatch(r, /max-height: 400px/);
});

// ---- review round 1 additions ----

test('no close-button rule sets position: static (the hit area anchors to the X) (B1)', () => {
    const closeSel = /(minigame-close-button|epr-kiosk-close|dli-modal-close|lf-overlay-close|pc-monitor-close|sis-modal-close|se-overlay-close|[a-z-]*-close-btn|[a-z-]*-modal-close|[a-z-]*overlay-close)/;
    const bad = [];
    for (const f of readdirSync(css).filter((n) => n.endsWith('.css'))) {
        const text = read(f).replace(/\/\*[\s\S]*?\*\//g, '');
        for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
            const sel = m[1].trim();
            if (!closeSel.test(sel) || /::after|::before/.test(sel)) continue;
            if (!/\.minigame-close-button|epr-kiosk-close|dli-modal-close|lf-overlay-close|pc-monitor-close|sis-modal-close|se-overlay-close/.test(sel)) continue;
            if (/position:\s*static/.test(m[2])) bad.push(`${f}: ${sel}`);
        }
    }
    assert.deepEqual(bad, []);
});

test('title-bar X hit area stays clear of the new-tab button and inside the bar (M1)', () => {
    const r = rule(read('minigames-framework.css'), '.title-bar .minigame-close-button::after');
    const m = r.match(/inset:\s*(-?\d+)px (-?\d+)px (-?\d+)px (-?\d+)px/);
    assert.ok(m, 'four-value inset');
    const [top, , bottom, left] = m.slice(1).map(Number);
    assert.ok(top >= -13 && bottom >= -13, 'no more than 13px above or below');
    assert.ok(left >= -2, 'does not reach left past the X edge');
});

test('pc-monitor bezel X hit area does not spill downward (m1)', () => {
    assert.match(rule(read('pc-monitor.css'), '.pc-monitor-bezel > .pc-monitor-close::after'), /inset: -14px -14px -4px -14px/);
});

test('se-overlay-close touch hit area is 44px (m2)', () => {
    assert.match(read('minigames-framework.css'), /\.se-overlay-close::after \{[^}]*inset: -11px/);
});

test('dusting key-end notch is 2px (m3)', () => {
    const line = read('dusting.css').split('\n').find((l) => l.startsWith('.dusting-key-end {'));
    assert.doesNotMatch(line, /3px/);
    assert.match(line, /2px/);
});

test('vm-launcher max-height uses dvh only (m4)', () => {
    const r = rule(read('vm-launcher-minigame.css'), '.vm-launcher');
    assert.match(r, /min\(400px, calc\(100dvh - \d+px\)\)/);
    assert.doesNotMatch(r, /100vh/);
});

test('vm-launcher JS injects no stylesheet and the moved rules live in the css (M2)', () => {
    const js = readFileSync(join(css, '../js/minigames/vm-launcher/vm-launcher-minigame.js'), 'utf8');
    assert.doesNotMatch(js, /createElement\('style'\)/);
    assert.doesNotMatch(js, /\.vm-launcher \{/);
    const s = read('vm-launcher-minigame.css');
    for (const sel of ['.vm-ip-display', '.vm-ip-display .vm-detail-label', '.vm-ip-value', '.vm-names', '.vm-name-badge', '.standalone-instructions h3']) rule(s, sel);
    assert.doesNotMatch(s, /font-size: (12|13|14|20)px/);
});

test('vm-launcher comment no longer cites the Open VM Console link (n3)', () => {
    assert.doesNotMatch(rule(read('vm-launcher-minigame.css'), '.vm-launcher'), /Open VM Console/);
});
