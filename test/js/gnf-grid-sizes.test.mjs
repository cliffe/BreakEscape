// UI sweep B4/B5: GNF is crisp only at 16, 24, 32 ... px and Press Start 2P only at
// multiples of 8. Scans the RFID, password, lockpicking, biometrics and PIN stylesheets.
// A rule's family is its own font-family, else the family the same full selector sets in
// the same media context, else the base rule for that selector, else the container default (GNF).
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const css = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/css');
const SHEETS = ['rfid-minigame.css', 'password-minigame.css', 'scanner-panel.css', 'lockpicking.css', 'biometrics-minigame.css', 'pin.css'];
// Emoji/icon glyph boxes, not text. Icon-named rules that hold words (.ble-device-icon) are counted.
const ICONS = /\.(bce-view-icon|nsm-modal-icon|protocol-icon)\b/;
// Rules that carry no font-family but sit inside a parent that sets one
const INHERITED = [[/\.fpr-/, 'VT323'], [/\.pin-minigame-attempt-feedback/, 'Press Start 2P'],
    [/signin-title|signin-portrait/, 'Press Start 2P'], [/lockpicking-item-info h4/, 'Press Start 2P']];

function fontRules(file) {
    const text = readFileSync(join(css, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
    const out = [];
    const ctx = [];            // enclosing at-rule preludes (@media ...)
    let buf = '';
    let line = 1;
    let startLine = 1;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '\n') line++;
        if (ch === '{') {
            const prelude = buf.trim().replace(/\s+/g, ' ');
            if (/^@(media|supports)/.test(prelude)) ctx.push(prelude); else ctx.push(null);
            // rule body runs to the next closing brace (no nested rules inside style rules)
            const end = text.indexOf('}', i);
            const body = text.slice(i + 1, end);
            if (!/^@/.test(prelude)) {
                const size = body.match(/font-size:\s*(\d+(?:\.\d+)?)px/);
                const fam = body.match(/font-family:\s*'?([^',;]+)/);
                if (size || fam) {
                    out.push({
                        file, line, sel: prelude, media: ctx.filter(Boolean).join(' && '),
                        size: size ? Number(size[1]) : null, fam: fam ? fam[1].trim() : null,
                    });
                }
            }
            if (!/^@/.test(prelude)) { line += (body.match(/\n/g) || []).length; i = end; ctx.pop(); }
            buf = '';
        } else if (ch === '}') {
            ctx.pop();
            buf = '';
        } else {
            buf += ch;
        }
    }
    return out;
}

for (const file of SHEETS) {
    test(`${file}: GNF sizes are multiples of 8 from 16, Press Start 2P multiples of 8`, () => {
        const rules = fontRules(file);
        // family per full selector within one media context; the base rule is the fallback
        const famBy = new Map();
        for (const r of rules) if (r.fam) famBy.set(`${r.media}||${r.sel}`, r.fam);
        const bad = [];
        let checked = 0;
        for (const r of rules) {
            if (r.size === null || ICONS.test(r.sel)) continue;
            const inh = INHERITED.find(([re]) => re.test(r.sel));
            const fam = r.fam || (inh && inh[1]) || famBy.get(`${r.media}||${r.sel}`) || famBy.get(`||${r.sel}`) || 'GNF';
            if (fam === 'VT323') continue;
            checked++;
            if (fam === 'GNF' && !(r.size >= 16 && r.size % 8 === 0)) bad.push(`${r.file}:${r.line} ${r.sel} GNF ${r.size}px`);
            if (fam === 'Press Start 2P' && r.size % 8 !== 0) bad.push(`${r.file}:${r.line} ${r.sel} PS2P ${r.size}px`);
        }
        assert.ok(checked > 0, 'sheet has sized rules');
        assert.deepEqual(bad, []);
    });
}

// Updated by the sign-in phone work (AC0 card 3, 20 Nov): a short frame still drops the line, but a
// compact portrait frame keeps it at GNF 16 on one line, cut with an ellipsis inside the 76px tile.
test('the 16px username line gives way on a short PC monitor and stays, one line with an ellipsis, on a compact one (R2 M1)', () => {
    const css = readFileSync(new URL('../../public/break_escape/css/password-minigame.css', import.meta.url), 'utf8');
    assert.match(css, /\.pc-monitor\[data-short\] \.signin-username\s*\{\s*display: none;/);
    assert.match(css, /\.pc-monitor\[data-short\] \.signin-tile\[data-username-fits\] \.signin-username\s*\{[^}]*display: block;[^}]*white-space: nowrap;[^}]*text-overflow: ellipsis;/, 'a short tile with 16px to spare keeps one ellipsised line');
    assert.match(css, /\.pc-monitor\[data-compact\]:not\(\[data-short\]\) \.signin-username\s*\{[^}]*white-space: nowrap;[^}]*text-overflow: ellipsis;/);
    assert.ok(!/\.pc-monitor\[data-compact\] \.signin-username\s*\{\s*display: none;/.test(css), 'a compact (not short) frame no longer hides the line');
});

// Elements that set no size of their own inherit the framework's 16px GNF from .minigame-container,
// which the scan above cannot see. Each of these must declare a grid size itself, and none may
// declare an off-grid one (live run, 18 Nov: all of them drew at 18px, the old default).
const OWN_SIZE = [
    ['password-minigame.css', '.pc-screen-area .signin-prompt'],
    ['pc-monitor.css', '.pc-monitor > .postit-note.pc-monitor-postit'],
    ['pin.css', '.pin-minigame-attempt-empty'],
    ['combination-minigame.css', '.combination-reset-btn, .combination-unlock-btn'],
    ['biometrics-minigame.css', '.sample-quality'],
    ['panels.css', '.sample-quality'],
];
for (const [file, sel] of OWN_SIZE) {
    test(`${file}: ${sel.replace(/\n/g, ' ')} declares its own GNF grid size`, () => {
        const rules = fontRules(file).filter((r) => r.sel === sel && !r.media);
        const sizes = rules.map((r) => r.size).filter((s) => s !== null);
        assert.ok(sizes.length > 0, 'a base rule sets font-size (else it inherits the framework 16px)');
        for (const s of sizes) assert.ok(s >= 16 && s % 8 === 0, `${sel} is ${s}px`);
    });
}

test('a compact tile name wraps, so "Other user" fits the 76px of content', () => {
    const text = readFileSync(join(css, 'password-minigame.css'), 'utf8');
    assert.match(text, /\.pc-monitor\[data-compact\] \.signin-other \.signin-name\s*\{\s*white-space: normal;/);
    assert.match(text, /\.signin-other \.signin-name,\s*\.signin-other \.signin-username\s*\{\s*white-space: nowrap;/);
});
