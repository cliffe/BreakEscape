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
// draws in VT323 (no pixel grid, so its 18px stays) are listed here; biometrics only inside .fpr-, bar the .fpr-card buttons (GNF).
const VT323_ROOT = new Set(['dusting.css', 'coverage-decision-form-minigame.css', 'scada-historian-minigame.css',
    'drug-library-integrity-minigame.css', 'log-filter-minigame.css', 'ncsc-brief-minigame.css',
    'combination-minigame.css', 'cryptex-minigame.css', 'flag-station-minigame.css',
    'forensic-data-platform-minigame.css', 'network-architecture-minigame.css', 'patch-panel-minigame.css',
    'warranty-checklist-minigame.css', 'lock-step.css', 'lock-step-push.css']);
const VT323_SELECTOR = [['biometrics-minigame.css', /\.fpr-(?!card)/]];

// First family in a font-family value, quotes stripped: "VT323", 'VT323' and VT323 are the same.
function firstFamily(value) {
    const first = value.split(',')[0].trim().replace(/^["']|["']$/g, '').trim();
    return first;
}

// Faces behind the shared variables (fonts.css, ui-themes.css): both resolve to GNF.
const VAR_FACE = { '--se-font-readable': 'GNF', '--ui-heading-font': 'GNF' };
function varFace(value) {
    const m = value.match(/^var\(\s*(--[\w-]+)/);
    return m ? (VAR_FACE[m[1]] || null) : undefined;
}

// Form controls inside .minigame-container draw in GNF whatever the sheet root says:
// `.minigame-container button { font-family: 'GNF' }` is (0,1,1), which beats a sheet's (0,1,0)
// `.x-btn { font-family: inherit }` or `{ font-family: 'VT323' }`. Odd button class names go here.
const EXTRA_CONTROLS = new Set(['lf-filter-token-remove', 'dusting-view', 'fdp-tab', 'fpr-card']);
function lastCompound(sel) {
    const last = sel.split(',').pop().trim();
    return last.split(/[\s>+~]+/).pop();
}
function isControl(sel) {
    // a rule that lists a control anywhere in its comma list draws that control in GNF
    return sel.split(',').some((part) => {
        const c = lastCompound(part);
        return /^(button|input|select|textarea)\b/.test(c) || /(?:^|[^\w-])(button|input|select|textarea)\b/.test(c)
            || /\.[\w-]*-(btn|button)\b/.test(c) || [...EXTRA_CONTROLS].some((n) => new RegExp('\\.' + n + '(?![\\w-])').test(c));
    });
}
function specificity(sel) {
    const s = sel.split(',').pop().replace(/::?[\w-]+(\([^)]*\))?/g, (m) => (m.startsWith('::') ? ' x' : '.p'));
    const ids = (s.match(/#[\w-]+/g) || []).length;
    const cls = (s.match(/\.[\w-]+|\[[^\]]*\]/g) || []).length;
    const els = (s.replace(/#[\w-]+|\.[\w-]+|\[[^\]]*\]/g, ' ').match(/(?:^|[\s>+~])[a-z][\w-]*/gi) || []).length;
    return [ids, cls, els];
}
function beatsFramework(sel) {
    const [i, c, e] = specificity(sel);
    return i > 0 || c > 1 || (c === 1 && e > 1);
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
        if (fam && fam.startsWith('var(')) fam = varFace(famM[1].trim()) || null;
        if (isControl(sel) && !(fam && beatsFramework(sel))) fam = 'GNF';
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

// Guard for VT323_ROOT: the first plain (single-compound) rule in a sheet that sets a font-family
// is the sheet root. A sheet whose root names VT323 first must be listed above, or its 18px text
// gets reported as GNF and the tempting fix is to shrink VT323 text to 16.
test('VT323_ROOT lists every sheet whose root rule draws in VT323', () => {
    const missing = [];
    for (const f of SHEETS) {
        if (VT323_ROOT.has(f) || VT323_SELECTOR.some(([sf]) => sf === f)) continue;
        const text = readFileSync(join(css, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
        const re = /([^{}]+)\{([^{}]*)\}/g;
        let m;
        while ((m = re.exec(text))) {
            const sel = m[1].trim();
            if (/[\s>+~,]/.test(sel) || !/^[.#]?[\w-]+$/.test(sel)) continue;
            const fm = m[2].match(/font-family:\s*([^;]+)/);
            if (!fm) continue;
            if (firstFamily(fm[1]) === 'VT323') missing.push(`${f}: root ${sel} draws in VT323`);
            break;
        }
    }
    assert.deepEqual(missing, []);
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

// Icon-named rules are counted too (.ble-device-icon holds the words TARGET and PAIRED). Only these
// are real glyph or emoji boxes, not text, and are skipped.
const GLYPH_ICONS = /\.(bce-view-icon|nsm-modal-icon|protocol-icon)\b/;
function offGridCounts() {
    const counts = {};
    for (const f of SHEETS) {
        let n = 0;
        for (const r of rulesOf(f)) {
            if (r.fam === 'GNF' && !GLYPH_ICONS.test(r.sel) && !(r.size >= 16 && r.size % 8 === 0)) n++;
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
