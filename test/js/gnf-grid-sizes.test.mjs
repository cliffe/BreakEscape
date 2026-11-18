// UI sweep B4/B5: GNF is crisp only at 16, 24, 32 ... px and Press Start 2P only at
// multiples of 8. Scans the RFID, password, lockpicking, biometrics and PIN stylesheets.
// A rule's family is its own font-family, else the family another rule on the same final
// selector token sets in that sheet, else the minigame container default (GNF).
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const css = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/css');
const SHEETS = ['rfid-minigame.css', 'password-minigame.css', 'lockpicking.css', 'biometrics-minigame.css', 'pin.css'];
// Emoji/icon glyph boxes, not text
const ICONS = /icon/;
// Rules that carry no font-family but sit inside a parent that sets one
const INHERITED = [[/\.fpr-/, 'VT323'], [/\.pin-minigame-attempt-feedback/, 'Press Start 2P']];

function fontRules(file) {
    const text = readFileSync(join(css, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
    const out = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(text))) {
        const size = m[2].match(/font-size:\s*(\d+(?:\.\d+)?)px/);
        const fam = m[2].match(/font-family:\s*'?([^',;]+)/);
        if (!size && !fam) continue;
        const sel = m[1].trim().replace(/\s+/g, ' ');
        const last = sel.split(',').pop().trim().split(/[\s>+~]+/).pop().replace(/::?[\w-]+(\([^)]*\))?$/, '');
        const line = text.slice(0, m.index + m[0].indexOf('{')).split('\n').length;
        out.push({ file, line, sel, last, size: size ? Number(size[1]) : null, fam: fam ? fam[1].trim() : null });
    }
    return out;
}

for (const file of SHEETS) {
    test(`${file}: GNF sizes are multiples of 8 from 16, Press Start 2P multiples of 8`, () => {
        const rules = fontRules(file);
        const famByLast = new Map();
        for (const r of rules) if (r.fam) famByLast.set(r.last, r.fam);
        const bad = [];
        let checked = 0;
        for (const r of rules) {
            if (r.size === null || ICONS.test(r.sel)) continue;
            const inh = INHERITED.find(([re]) => re.test(r.sel));
            const fam = r.fam || (inh && inh[1]) || famByLast.get(r.last) || 'GNF';
            if (fam === 'VT323') continue;
            checked++;
            if (fam === 'GNF' && !(r.size >= 16 && r.size % 8 === 0)) bad.push(`${r.file}:${r.line} ${r.sel} GNF ${r.size}px`);
            if (fam === 'Press Start 2P' && r.size % 8 !== 0) bad.push(`${r.file}:${r.line} ${r.sel} PS2P ${r.size}px`);
        }
        assert.ok(checked > 0, 'sheet has sized rules');
        assert.deepEqual(bad, []);
    });
}
