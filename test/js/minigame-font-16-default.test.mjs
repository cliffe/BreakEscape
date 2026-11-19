// D164: the minigame default text size is 16px (GNF's pixel grid), not 18px.
// The framework sets it on .minigame-container; elements that set no size inherit it.
// No minigame stylesheet may set 18px on text that draws in GNF or Press Start 2P (VT323 has no
// grid and keeps its 18px; a rule's face is its own font-family, else its sheet root's), and no GNF rule may sit off the 8px grid
// (16, 24, 32 ...) unless it is listed in KNOWN_OFF_GRID (older sizes this change does
// not touch; counts are exact, so the list can only shrink).
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';

const css = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/css');
// Sheets for the game HUD and chrome, not minigame text
const NOT_MINIGAME = new Set(['game-menu.css', 'hud.css', 'main.css', 'modals.css', 'notifications.css',
    'npc-barks.css', 'objectives.css', 'panels.css', 'player_preferences.css', 'tutorial.css', 'inventory.css',
    'fonts.css', 'ui-themes.css']);

// The face a sheet's text draws in when a rule names none: the sheet's root rule decides.
// Everything not listed is GNF (the framework's .minigame-container face). Sheets whose root
// draws in VT323 (no pixel grid, so its 18px stays) are listed here; biometrics only inside .fpr-.
const VT323_ROOT = new Set(['dusting.css', 'coverage-decision-form-minigame.css', 'scada-historian-minigame.css',
    'drug-library-integrity-minigame.css', 'log-filter-minigame.css', 'ncsc-brief-minigame.css',
    'combination-minigame.css', 'cryptex-minigame.css']);
const VT323_SELECTOR = [['biometrics-minigame.css', /\.fpr-/]];

// First family in a font-family value, quotes stripped: "VT323", 'VT323' and VT323 are the same.
function firstFamily(value) {
    const first = value.split(',')[0].trim().replace(/^["']|["']$/g, '').trim();
    return first;
}

function rulesOf(file) {
    const text = readFileSync(join(css, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
    const out = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(text))) {
        const body = m[2];
        const size = body.match(/(?:^|[;\s])font-size:\s*(\d+(?:\.\d+)?)(px|em|rem)\b/);
        const famM = body.match(/font-family:\s*([^;]+)/);
        if (!size) continue;
        const sel = m[1].trim().replace(/\s+/g, ' ');
        let fam = famM ? firstFamily(famM[1]) : null;
        if (fam === 'inherit') fam = null;
        if (!fam) {
            const sheetVt = VT323_ROOT.has(file) || VT323_SELECTOR.some(([f, rx]) => f === file && rx.test(sel));
            fam = sheetVt ? 'VT323' : 'GNF';
        }
        // em/rem against the 16px framework default (nested em chains are not followed)
        const px = size[2] === 'px' ? Number(size[1]) : Number(size[1]) * 16;
        const line = text.slice(0, m.index + m[1].length + 1 + size.index).split('\n').length;
        out.push({ file, line, sel: sel.slice(-70), size: px, unit: size[2], fam });
    }
    return out;
}
const SHEETS = readdirSync(css).filter((f) => f.endsWith('.css') && !NOT_MINIGAME.has(f));

test('the framework container and its text default to GNF at 16px', () => {
    const fw = readFileSync(join(css, 'minigames-framework.css'), 'utf8');
    const m = fw.match(/\.minigame-container\s*\{[^}]*\}/);
    assert.ok(m, '.minigame-container rule exists');
    assert.match(m[0], /font-family:\s*'GNF'/);
    assert.match(m[0], /font-size:\s*16px;/);
    assert.doesNotMatch(fw, /font-size:\s*18px/, 'no 18px left in the framework sheet');
});

test('no minigame sheet sets 18px on text that draws in GNF or Press Start 2P', () => {
    const bad = [];
    for (const f of SHEETS) for (const r of rulesOf(f)) {
        if (r.size === 18 && r.fam !== 'VT323') bad.push(`${r.file}:${r.line} ${r.sel} (${r.fam})`);
    }
    assert.deepEqual(bad, []);
});

// Off-grid GNF sizes that existed before D164 and were not part of the 18px change.
// Keys are file names; each count is exact. Fixing a rule fails this test until the number
// in the JSON is lowered in the same commit, so the list can only shrink.
const KNOWN_OFF_GRID = JSON.parse(readFileSync(new URL('./minigame-font-16-offgrid.json', import.meta.url), 'utf8'));

function offGridCounts() {
    const counts = {};
    for (const f of SHEETS) {
        let n = 0;
        for (const r of rulesOf(f)) {
            if (r.fam === 'GNF' && !/icon/.test(r.sel) && !(r.size >= 16 && r.size % 8 === 0)) n++;
        }
        if (n) counts[f] = n;
    }
    return counts;
}
if (process.env.FONT16_PRINT) console.log(JSON.stringify(offGridCounts(), null, 1));

test('GNF rules in minigame sheets stay on the 8px grid, bar the known older ones (exact counts)', () => {
    const counts = offGridCounts();
    const problems = [];
    for (const f of new Set([...Object.keys(counts), ...Object.keys(KNOWN_OFF_GRID)])) {
        const n = counts[f] || 0;
        const ceiling = KNOWN_OFF_GRID[f] || 0;
        if (n > ceiling) problems.push(`${f}: ${n} off-grid GNF rules, ceiling ${ceiling}`);
        else if (n < ceiling) problems.push(`${f}: ${n} off-grid GNF rules, lower its ceiling in minigame-font-16-offgrid.json to ${n}${n === 0 ? ' (delete the key)' : ''}`);
    }
    assert.deepEqual(problems, []);
});
