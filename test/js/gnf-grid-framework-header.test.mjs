// Sweep 6 fw: the framework header and .instructions sat off the GNF grid (20px and 12px).
// The title (h3) is Press Start 2P 16 on a 24px line and the subtitle GNF 16; both stay.
// Comments are stripped before matching; every rule naming the selector is read (media blocks too).
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const css = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/css');
const src = readFileSync(join(css, 'minigames-framework.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
function all(sel, prop) {
    const out = [];
    for (const m of src.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const names = m[1].split(',').map((x) => x.trim());
        if (!names.some((n) => n === sel || n.endsWith(' ' + sel))) continue;
        const d = m[2].match(new RegExp(`(?:^|[;\\s])${prop}:\\s*([^;]+)`));
        if (d) out.push(d[1].trim());
    }
    return out;
}
function everyIs(sel, prop, want) {
    const v = all(sel, prop);
    assert.ok(v.length > 0, `${sel} declares ${prop}`);
    assert.ok(v.every((x) => x === want), `${sel} ${prop} in every rule is ${want}, got ${v.join(' | ')}`);
}

test('.minigame-header text is GNF 16, not 20', () => {
    everyIs('.minigame-header', 'font-size', '16px');
});
test('.instructions is GNF 16 on a whole-pixel line', () => {
    everyIs('.instructions', 'font-size', '16px');
    everyIs('.instructions', 'line-height', '24px');
});
test('the header title and subtitle keep their faces and grid sizes', () => {
    everyIs('.minigame-header h3', 'font-size', '16px');
    everyIs('.minigame-header h3', 'line-height', '24px');
    everyIs('.minigame-header p', 'font-size', '16px');
});
test('no media block in the framework sheet shrinks the header or instructions', () => {
    for (const sel of ['.minigame-header', '.minigame-header h3', '.minigame-header p', '.instructions']) {
        assert.ok(all(sel, 'font-size').length === 1, `${sel} has one font-size rule`);
    }
});
