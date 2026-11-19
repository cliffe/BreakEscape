// D164: the minigame default text size is 16px (GNF's pixel grid), not 18px.
// The framework sets it on .minigame-container; elements that set no size inherit it.
// No minigame stylesheet may set 18px on GNF or Press Start 2P text (VT323 has no grid
// and keeps its 18px where a sheet chose it), and no GNF rule may sit off the 8px grid
// (16, 24, 32 ...) unless it is listed in KNOWN_OFF_GRID (older sizes this change does
// not touch; the list may only shrink).
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

function rulesOf(file) {
    const text = readFileSync(join(css, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
    const out = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(text))) {
        const body = m[2];
        const size = body.match(/(?:^|[;\s])font-size:\s*(\d+(?:\.\d+)?)px/);
        const fam = body.match(/font-family:\s*'?([^',;]+)/);
        if (!size) continue;
        const line = text.slice(0, m.index + m[1].length + 1 + size.index).split('\n').length;
        out.push({ file, line, sel: m[1].trim().replace(/\s+/g, ' ').slice(-70), size: Number(size[1]), fam: fam ? fam[1].trim() : null });
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

test('no minigame sheet sets 18px on GNF, Press Start 2P or an inherited face', () => {
    const bad = [];
    for (const f of SHEETS) for (const r of rulesOf(f)) {
        if (r.size === 18 && r.fam !== 'VT323') bad.push(`${r.file}:${r.line} ${r.sel} (${r.fam || 'inherited'})`);
    }
    assert.deepEqual(bad, []);
});

// Off-grid GNF sizes that existed before D164 and were not part of the 18px change.
// Keys are file names; a count here is a ceiling, so fixing one lowers the number.
const KNOWN_OFF_GRID = JSON.parse(readFileSync(new URL('./minigame-font-16-offgrid.json', import.meta.url), 'utf8'));

test('GNF rules in minigame sheets stay on the 8px grid, bar the known older ones', () => {
    const over = [];
    for (const f of SHEETS) {
        const rules = rulesOf(f);
        const famBy = new Map();
        for (const r of rules) if (r.fam) famBy.set(r.sel, r.fam);
        let n = 0;
        for (const r of rules) {
            const fam = r.fam || famBy.get(r.sel) || 'GNF';
            if (fam === 'GNF' && !/icon/.test(r.sel) && !(r.size >= 16 && r.size % 8 === 0)) n++;
        }
        const ceiling = KNOWN_OFF_GRID[f] || 0;
        if (n > ceiling) over.push(`${f}: ${n} off-grid GNF rules, ceiling ${ceiling}`);
    }
    assert.deepEqual(over, []);
});
