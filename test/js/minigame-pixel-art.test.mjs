// Pixel-art UI rule for the older minigames (UX feedback round, slice 7).
// Every UI graphic must be pixel art: borders 2px (solid, square) or the ui-themes 9-slice
// skin; pixel fonts only (GNF, Press Start 2P, VT323, or the --se-font-* / --ui-*-font
// variables); no 1px hairlines, no smooth border-radius (stepped clip-path corners are pixel
// art), no blurred shadows or glows, no smooth gradients (hard-stop stripes are pixel art).
// This is the static half of the check; tools/playtest/pixel-style-sweep.mjs checks the
// computed styles of the same minigames in a browser.
// Run with: node --test test/js/minigame-pixel-art.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '../../public/break_escape');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

// The slice 7 list, worst first, with the framework shell
const CSS_FILES = [
    'css/minigames-framework.css',
    'css/drug-library-integrity-minigame.css',
    'css/pin.css',
    'css/scada-historian-minigame.css',
    'css/biometrics-minigame.css',
    'css/ble-scanner.css',
    'css/bluetooth-scanner.css',
    'css/siem-dashboard-minigame.css',
    'css/text-file-minigame.css',
    'css/forensic-data-platform-minigame.css',
    'css/ncsc-brief-minigame.css',
    'css/network-architecture-minigame.css',
    'css/infusion-pump-minigame.css',
    'css/notes.css'
];
const JS_DIRS = [
    'drug-library-integrity', 'pin', 'scada-historian', 'biometrics', 'ble-scanner', 'bluetooth',
    'siem', 'text-file', 'forensic-data-platform', 'ncsc-brief', 'network-architecture',
    'infusion-pump', 'notes'
].map(d => `js/minigames/${d}`);

const ALLOWED_FONTS = ['gnf', 'press start 2p', 'vt323', 'inherit'];
const fontOk = (family) => {
    const first = family.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
    if (/^var\(--(se-font-|ui-[a-z-]*font)/.test(first)) return true;
    return ALLOWED_FONTS.includes(first);
};

// Split a value at commas that are not inside brackets
const splitTop = (v) => {
    const out = []; let depth = 0, cur = '';
    for (const ch of v) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
};
const COLOR_RE = /(rgba?\([^)]*\)|hsla?\([^)]*\)|#[0-9a-f]{3,8}\b|\btransparent\b|\bcurrentColor\b|\bvar\([^)]*\)|\b[a-z]+\b)/i;
const LEN_RE = /-?\d*\.?\d+(px|%|em|rem)?/g;

// Blur radius of every shadow in a box-shadow or text-shadow value
const blurs = (v) => splitTop(v).map(sh => {
    if (/^none$/i.test(sh.trim())) return 0;
    const lens = sh.replace(/rgba?\([^)]*\)|hsla?\([^)]*\)|var\([^)]*\)|#[0-9a-f]+|\binset\b|\b[a-z]+\b/gi, ' ').match(LEN_RE) || [];
    return parseFloat(lens[2] || '0');
});

// A gradient is pixel art only when every change of colour is a hard stop
function gradientIsHard(fn) {
    const inner = fn.slice(fn.indexOf('(') + 1, fn.lastIndexOf(')'));
    let args = splitTop(inner);
    if (/^(to\s|-?\d*\.?\d+(deg|turn|rad)|circle|ellipse|closest|farthest|at\s)/i.test(args[0])) args = args.slice(1);
    const stops = args.map(a => {
        const color = (a.match(COLOR_RE) || [''])[0];
        const pos = a.replace(color, '').trim().split(/\s+/).filter(Boolean);
        return { color: color.replace(/\s/g, '').toLowerCase(), first: pos[0], last: pos[pos.length - 1] };
    });
    for (let i = 1; i < stops.length; i++) {
        const a = stops[i - 1], b = stops[i];
        if (a.color === b.color) continue;
        if (!a.last || !b.first || parseFloat(a.last) !== parseFloat(b.first)) return false;
    }
    return true;
}
const gradients = (v) => (v.match(/(repeating-)?(linear|radial|conic)-gradient\((?:[^()]|\([^()]*\))*\)/gi) || []);

// Every rule (at any @media depth) as { selector, decls: [[prop, value]] }
function cssRules(src) {
    src = src.replace(/\/\*[\s\S]*?\*\//g, '');
    const out = [];
    const re = /([^{};]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(src))) {
        const decls = [];
        for (const d of m[2].split(';')) {
            const i = d.indexOf(':');
            if (i > 0) decls.push([d.slice(0, i).trim().toLowerCase(), d.slice(i + 1).replace(/!important/, '').trim()]);
        }
        out.push({ selector: m[1].trim().replace(/\s+/g, ' '), decls });
    }
    return out;
}

function cssBreaches(file) {
    const found = [];
    for (const { selector, decls } of cssRules(read(file))) {
        const has = (p) => decls.some(([k]) => k === p);
        const clipped = has('clip-path');
        for (const [prop, value] of decls) {
            const at = `${file} ${selector} { ${prop}: ${value} }`;
            if (/^(border|border-(top|right|bottom|left)|outline|border-width|border-(top|right|bottom|left)-width|outline-width)$/.test(prop)) {
                if (!/\bnone\b|\bhidden\b/.test(value) && /(^|\s)(0?\.\d+|1)px\b/.test(value)) found.push(`hairline: ${at}`);
            }
            if (/^border(-(top|bottom)-(left|right))?-radius$/.test(prop)) {
                if (!/^(0(px)?\s*)+$/.test(value) && !clipped) found.push(`radius: ${at}`);
            }
            if (prop === 'box-shadow' || prop === 'text-shadow') {
                if (blurs(value).some(b => b > 0)) found.push(`shadow: ${at}`);
                // a hard 1px offset or ring is a hairline too
                else if (/(^|[\s,])(0?\.\d+|1)px\b/.test(value)) found.push(`hairline: ${at}`);
            }
            if (prop === 'filter' && (/blur\(/.test(value) || /drop-shadow\(/.test(value) && blurs(value.replace(/drop-shadow\(([^()]|\([^()]*\))*\)/, s => s.slice(12, -1))).some(b => b > 0))) found.push(`shadow: ${at}`);
            if (/^(background|background-image|border-image|border-image-source)$/.test(prop)) {
                for (const g of gradients(value)) if (!gradientIsHard(g)) found.push(`gradient: ${at}`);
            }
            if (prop === 'font-family' && !fontOk(value)) found.push(`font: ${at}`);
            if (prop === 'font') {
                const fam = value.match(/\d+(\.\d+)?(px|em|rem|%|pt)(\/\S+)?\s+(.+)$/);
                if (fam && !fontOk(fam[4])) found.push(`font: ${at}`);
            }
        }
    }
    return found;
}

function jsFiles(dir) {
    return readdirSync(join(ROOT, dir)).filter(f => f.endsWith('.js')).map(f => `${dir}/${f}`);
}

// Inline styles written by the scenes themselves (style strings, SVG attributes, Phaser text)
function jsBreaches(file) {
    const src = read(file);
    const found = [];
    const lines = src.split('\n');
    lines.forEach((line, i) => {
        const at = `${file}:${i + 1}`;
        if (/^\s*(\/\/|\*)/.test(line)) return;
        for (const m of line.matchAll(/(?:fontFamily|'font-family'|"font-family"|font-family)\s*[:,=]\s*(['"`])([^'"`]+)\1/g)) {
            if (!fontOk(m[2])) found.push(`font: ${at} ${m[2]}`);
        }
        for (const m of line.matchAll(/font-family\s*:\s*([^;"'`]+)/g)) {
            if (!fontOk(m[1])) found.push(`font: ${at} ${m[1].trim()}`);
        }
        for (const m of line.matchAll(/\bfont\s*:\s*['"`]\s*(?:bold\s+)?\d+px\s+([^'"`]+)['"`]/g)) {
            if (!fontOk(m[1])) found.push(`font: ${at} ${m[1]}`);
        }
        if (/border-radius\s*:\s*(?!0[;\s'"`]|0px)/.test(line) || /borderRadius\s*[:=]\s*['"`]?(?!0\b|0px)[\d.]/.test(line)) found.push(`radius: ${at}`);
        for (const m of line.matchAll(/(?:box|text)-shadow\s*:\s*([^;"'`]+)/g)) {
            if (blurs(m[1]).some(b => b > 0)) found.push(`shadow: ${at}`);
        }
        for (const g of gradients(line)) if (!gradientIsHard(g)) found.push(`gradient: ${at}`);
        if (/border(-(top|right|bottom|left))?\s*:\s*1px\s+(solid|dashed|dotted)/.test(line)) found.push(`hairline: ${at}`);
        // Canvas and SVG lines, and style setters (review R1 m2)
        if (/\b(lineStyle|setStrokeStyle)\(\s*(0?\.\d+|1)\s*,/.test(line)) found.push(`hairline: ${at}`);
        if (/stroke-width['"]?\s*[,=:]\s*['"](0?\.\d+|1(\.\d+)?)['"]/.test(line)) found.push(`hairline: ${at}`);
        if (/\.style\.border(Top|Right|Bottom|Left)?\s*=\s*['"`]\s*1px\b/.test(line)) found.push(`hairline: ${at}`);
        for (const m of line.matchAll(/\.style\.(?:boxShadow|textShadow)\s*=\s*['"`]([^'"`]+)['"`]/g)) {
            if (blurs(m[1]).some(b => b > 0)) found.push(`shadow: ${at}`);
        }
        for (const m of line.matchAll(/\.setShadow\(([^)]*)\)/g)) {
            const args = m[1].split(',').map(a => a.trim());
            if (parseFloat(args[3] || '0') > 0) found.push(`shadow: ${at}`);
        }
        // VT323 is legible from 16px, and pixel faces need whole-pixel sizes (review R1 M3, m5)
        if (/VT323/.test(line)) {
            for (const m of line.matchAll(/(?:fontSize\s*:\s*['"`]|font-size\s*[:=,]\s*['"]?)(\d+(?:\.\d+)?)/g)) {
                if (parseFloat(m[1]) < 16) found.push(`size: ${at} VT323 ${m[1]}px`);
            }
        }
        // Symbols the pixel fonts lack, drawn from a smooth fallback font (review R1 m4)
        const glyph = line.replace(/\/\/.*$/, '').match(/[\u2300-\u23ff\u2600-\u27bf\u2b00-\u2bff]|[\u{1F300}-\u{1FAFF}]|\\u(23|26|27)[0-9a-f]{2}/iu);
        if (glyph && !/console\.|data-key=/.test(line)) found.push(`glyph: ${at} ${glyph[0]}`);
    });
    return found;
}

// VT323 under 16px in the CSS. Sizes in px only (em sizes follow their parent). The network
// diagram's labels are SVG text in viewBox units, drawn at the diagram's whole-number scale
// (NAD1: always 2x, network-architecture-minigame.js), so their size on screen is the CSS size
// times that scale: that is what both font checks below measure for them.
const SVG_UNIT_LABELS = ['.nad-zone-label', '.nad-line-label', '.nad-node-label', '.nad-node-sub', '.nad-node-warn'];
function nadScale() {
    const js = read('js/minigames/network-architecture/network-architecture-minigame.js');
    const min = Number(js.match(/DIAGRAM_MIN_SCALE = (\d+);/)?.[1]);
    const max = Number(js.match(/DIAGRAM_MAX_SCALE = (\d+);/)?.[1]);
    assert.ok(min >= 1 && min === max, 'the diagram draws at one whole-number scale');
    return min;
}
const screenPx = (selector, px) => SVG_UNIT_LABELS.includes(selector) ? px * nadScale() : px;
function cssSmallVt323(file) {
    const found = [];
    for (const { selector, decls } of cssRules(read(file))) {
        const fam = decls.find(([k]) => k === 'font-family');
        const size = decls.find(([k]) => k === 'font-size');
        if (fam && /^['"]?VT323/i.test(fam[1]) && size && /^\d+(\.\d+)?px$/.test(size[1]) && screenPx(selector.trim(), parseFloat(size[1])) < 16) found.push(`${file} ${selector} ${size[1]}`);
    }
    return found;
}

test('the checker itself: hard-stop stripes pass, smooth gradients and blurs fail', () => {
    assert.equal(gradientIsHard('repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.10) 2px, rgba(0, 0, 0, 0.10) 4px)'), true);
    assert.equal(gradientIsHard('repeating-linear-gradient(90deg, #f97316 0, #f97316 6px, transparent 6px, transparent 10px)'), true);
    assert.equal(gradientIsHard('linear-gradient(145deg, #2c3e50, #34495e)'), false);
    assert.deepEqual(blurs('0 0 30px rgba(0, 0, 0, 0.8)'), [30]);
    assert.deepEqual(blurs('2px 2px 0 #000, inset 0 0 0 2px #fff'), [0, 0]);
    assert.equal(fontOk("'VT323', monospace"), true);
    assert.equal(fontOk("'Courier New', monospace"), false);
    assert.equal(fontOk('var(--se-font-body)'), true);
});

for (const file of CSS_FILES) {
    test(`pixel-art rule: ${file}`, () => {
        const found = cssBreaches(file);
        assert.deepEqual(found, [], `${found.length} breach(es):\n${found.slice(0, 40).join('\n')}`);
    });
}

for (const dir of JS_DIRS) {
    test(`pixel-art rule: inline styles in ${dir}`, () => {
        const found = jsFiles(dir).flatMap(jsBreaches);
        assert.deepEqual(found, [], `${found.length} breach(es):\n${found.slice(0, 40).join('\n')}`);
    });
}

test('the R1 checks: canvas hairlines, VT323 sizes and missing glyphs are caught', () => {
    const re = /\b(lineStyle|setStrokeStyle)\(\s*(0?\.\d+|1)\s*,/;
    assert.ok(re.test('gfx.lineStyle(1, 0xc8b880);'));
    assert.ok(!re.test('gfx.lineStyle(2, 0xc8b880);'));
});

for (const file of CSS_FILES) {
    test(`VT323 is 16px or larger: ${file}`, () => {
        const found = cssSmallVt323(file);
        assert.deepEqual(found, [], found.join('\n'));
    });
}

test('no minigame in the slice draws a Cancel beside the X; the shell keeps Esc and the X', () => {
    const base = read('js/minigames/framework/base-minigame.js');
    assert.match(base, /static keepsCancelButton = false;/);
    assert.match(base, /const showCancel = this\.constructor\.keepsCancelButton === true/);
    assert.match(base, /e\.key === 'Escape'/);
    for (const dir of JS_DIRS) {
        // notes keeps its Continue, the way on from reading a note
        if (dir.endsWith('/notes')) continue;
        for (const f of jsFiles(dir)) assert.doesNotMatch(read(f), /keepsCancelButton = true/, `${f} keeps a Cancel`);
    }
    assert.match(read('css/minigames-framework.css'), /\.minigame-controls:empty\s*\{\s*display: none;/);
});

test('VT323 is self-hosted, with its licence, and nothing loads Google Fonts', () => {
    const fonts = read('css/fonts.css');
    assert.match(fonts, /font-family: 'VT323';[\s\S]*?url\('\.\.\/assets\/fonts\/VT323\/VT323-latin\.woff2'\)/);
    assert.ok(readdirSync(join(ROOT, 'assets/fonts/VT323')).includes('OFL.txt'));
    for (const rel of [...CSS_FILES, 'css/bond-visualiser.css', ...JS_DIRS.flatMap(jsFiles)]) {
        assert.doesNotMatch(read(rel), /fonts\.googleapis\.com|fonts\.gstatic\.com/, rel);
    }
});

test('framework buttons glow with a hard 2px ring on hover, not a blurred glow', () => {
    const rules = cssRules(read('css/utilities.css')).filter(r => /\.minigame-button:hover/.test(r.selector));
    assert.ok(rules.length > 0, 'no .minigame-button:hover rule in utilities.css');
    for (const r of rules) for (const [p, v] of r.decls) if (p === 'box-shadow') assert.ok(blurs(v).every(b => b === 0), `${r.selector} box-shadow ${v}`);
});

// Slice 7 R5 M1: no pixel face is ever faux-bolded (each ships one weight)
test('every minigame turns off synthetic bold and draws pixel faces at weight 400', () => {
    const fw = cssRules(read('css/minigames-framework.css'));
    const shell = fw.find(r => r.selector.trim() === '.minigame-container');
    assert.ok(shell, 'no .minigame-container rule');
    assert.ok(shell.decls.some(([p, v]) => p === 'font-synthesis' && v.trim() === 'none'), '.minigame-container has no font-synthesis: none');
    const all = fw.find(r => /\.minigame-container \*/.test(r.selector) && r.decls.some(([p]) => p === 'font-weight'));
    assert.ok(all, 'no rule sets every element in a minigame to weight 400');
    // cssRules drops !important, so read it from the source
    assert.equal(all.decls.find(([p]) => p === 'font-weight')[1], '400');
    assert.match(read('css/minigames-framework.css'), /\.minigame-container \*[^{]*\{\s*font-weight: 400 !important;/);
});

// Slice 7 R5 M2: Press Start 2P draws one font pixel per eighth of its size
test('Press Start 2P sizes in the slice sheets sit on the 8px grid', () => {
    const off = [];
    for (const rel of [...CSS_FILES, 'css/container-minigame.css']) {
        for (const r of cssRules(read(rel))) {
            const fam = r.decls.find(([p]) => p === 'font-family');
            const size = r.decls.find(([p]) => p === 'font-size');
            if (!fam || !size || !/press start 2p/i.test(fam[1])) continue;
            const m = size[1].match(/^(\d+(?:\.\d+)?)px/);
            if (m && screenPx(r.selector.trim(), Number(m[1])) % 8 !== 0) off.push(`${rel} ${r.selector.trim()} ${size[1]}`);
        }
    }
    assert.deepEqual(off, []);
});

export { cssBreaches, jsBreaches, gradientIsHard, blurs, fontOk };
