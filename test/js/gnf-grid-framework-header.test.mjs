// Sweep 6 fw: the framework header and .instructions sat off the GNF grid (20px and 12px).
// The title (h3) is Press Start 2P 16 on a 24px line and the subtitle GNF 16; both stay.
// The header is hidden by default (base-minigame.js, unless params.headerElement), so these pins guard future use.
// Every sheet in public/break_escape/css is scanned; comments are stripped; every rule is read, media blocks
// included; the target may sit anywhere in a selector (compound, descendant, comma list); size comes from
// font-size and from the font shorthand.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';

const css = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/css');
const HEADER = /(?<![\w-])\.minigame-header(?![\w-])/;
const INSTR = /(?<![\w-])\.instructions(?![\w-])/;

// Which target a selector's last compound styles: 'header', 'h3', 'p', 'instructions' or null.
function targetOf(selector) {
    const flat = selector.replace(/\[[^\]]*\]/g, '[]').trim();
    const parts = flat.split(/\s*[>+~]\s*|\s+/).filter(Boolean);
    if (!parts.length) return null;
    const last = parts[parts.length - 1];
    const before = parts.slice(0, -1).join(' ');
    if (INSTR.test(last)) return 'instructions';
    if (HEADER.test(last)) return 'header';
    const tag = last.match(/^(h3|p)(?![\w-])/);
    if (tag && HEADER.test(before)) return tag[1];
    return null;
}

function sizeOf(decls) {
    const r = { size: null, line: null };
    for (const d of decls.split(';')) {
        const i = d.indexOf(':');
        if (i < 0) continue;
        const prop = d.slice(0, i).trim().toLowerCase();
        const val = d.slice(i + 1).trim();
        if (prop === 'font-size') r.size = val;
        else if (prop === 'line-height') r.line = val;
        else if (prop === 'font') {
            const m = val.match(/(?:^|\s)(\d*\.?\d+(?:px|rem|em|pt|%)|xx?-small|small|medium|large|x+-large|smaller|larger)(?:\/(\S+))?/i);
            if (m) { r.size = m[1]; if (m[2]) r.line = m[2]; }
        }
    }
    return r;
}

const rules = [];
for (const f of readdirSync(css).filter((n) => n.endsWith('.css')).sort()) {
    const src = readFileSync(join(css, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of src.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const { size, line } = sizeOf(m[2]);
        for (const sel of m[1].split(',')) {
            const t = targetOf(sel);
            if (t) rules.push({ file: f, sel: sel.trim(), target: t, size, line });
        }
    }
}
const where = (t, key) => rules.filter((r) => r.target === t && r[key] !== null);
function everyIs(t, key, want, inFramework = true) {
    const v = where(t, key);
    if (inFramework) assert.ok(v.some((r) => r.file === 'minigames-framework.css'), `${t} declares ${key} in the framework sheet`);
    const bad = v.filter((r) => r[key] !== want);
    assert.deepEqual(bad.map((r) => `${r.file}: ${r.sel} ${key} ${r[key]}`), [], `${t} ${key} must be ${want} everywhere`);
}

test('.minigame-header text is GNF 16, not 20', () => {
    everyIs('header', 'size', '16px');
});
test('.instructions is GNF 16 on a whole-pixel line', () => {
    everyIs('instructions', 'size', '16px');
    everyIs('instructions', 'line', '24px');
});
test('the header title and subtitle keep their faces and grid sizes', () => {
    everyIs('h3', 'size', '16px');
    everyIs('h3', 'line', '24px');
    everyIs('p', 'size', '16px');
});
test('no media block or other sheet re-sizes the header or instructions', () => {
    for (const t of ['header', 'h3', 'p', 'instructions']) {
        assert.equal(where(t, 'size').length, 1, `${t} has exactly one size rule in all sheets`);
    }
});
