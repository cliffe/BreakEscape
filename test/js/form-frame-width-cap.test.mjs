import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape');
const read = (p) => readFileSync(join(root, p), 'utf8');

const FRAMEWORK = 'css/minigames-framework.css';

// Evaluates a media condition at a viewport size: comma = or, ' and ' = and. Understands
// (min|max)-(width|height): Npx and the range form; throws on any other feature.
function mediaMatches(cond, w, h) {
    const q = cond.replace(/^@media\s*/i, '').trim();
    return q.split(',').some((clause) => clause.split(/\s+and\s+/i).every((f) => {
        const t = f.trim().replace(/^only\s+screen\s*|^screen\s*/i, '');
        if (t === '') return true;
        let m = t.match(/^\(\s*(min|max)-(width|height)\s*:\s*([\d.]+)px\s*\)$/i);
        if (m) { const v = m[2].toLowerCase() === 'width' ? w : h; return m[1].toLowerCase() === 'min' ? v >= +m[3] : v <= +m[3]; }
        m = t.match(/^\(\s*(width|height)\s*(>=|<=|>|<)\s*([\d.]+)px\s*\)$/i);
        if (m) { const v = m[1].toLowerCase() === 'width' ? w : h, n = +m[3]; return { '>=': v >= n, '<=': v <= n, '>': v > n, '<': v < n }[m[2]]; }
        throw new Error('unparsed media feature: ' + t);
    }));
}
const PHONES = [[390, 844], [844, 390], [915, 412], [932, 430], [956, 440], [997, 448], [1099, 500]];
const DESKTOPS = [[1024, 600], [1100, 500], [1280, 500], [1280, 500.5], [1280, 720], [1920, 1080]];

// Returns the condition text of the innermost @media block that encloses
// character index `idx`, or '' when the rule sits at top level.
function enclosingMedia(css, idx) {
    let depth = 0;
    for (let i = idx - 1; i >= 0; i--) {
        if (css[i] === '}') depth++;
        else if (css[i] === '{') {
            if (depth === 0) {
                const start = css.lastIndexOf('}', i) + 1;
                const head = css.slice(start, i).replace(/\/\*[\s\S]*?\*\//g, '').trim();
                if (head.startsWith('@media')) return head.replace(/\s+/g, ' ');
                return '';
            }
            depth--;
        }
    }
    return '';
}

// Body of the media block whose head starts at `idx` (the rule's enclosing block), comments stripped.
function enclosingMediaBody(css, idx) {
    let depth = 0, i = idx;
    for (; i >= 0; i--) {
        if (css[i] === '}') depth++;
        else if (css[i] === '{') { if (depth === 0) break; depth--; }
    }
    let d = 1, j = i + 1;
    while (d && j < css.length) { d += css[j] === '{' ? 1 : css[j] === '}' ? -1 : 0; j++; }
    return css.slice(i + 1, j - 1).replace(/\/\*[\s\S]*?\*\//g, '');
}

// The scene classes that share one cap rule, so the selector list is pinned exactly (wide R4 m1).
const SHARED_760 = ['cf-minigame-container', 'ncsc-minigame-container'];
const cases = [
    ['css/concern-form-minigame.css', 'cf-minigame-container', 760, 'js/minigames/concern-form/concern-form-minigame.js', SHARED_760],
    ['css/sis-config-threshold-minigame.css', 'sis-threshold-minigame-container', 800, 'js/minigames/sis-config-threshold/sis-config-threshold-minigame.js', ['sis-threshold-minigame-container']],
    ['css/ncsc-brief-minigame.css', 'ncsc-minigame-container', 760, 'js/minigames/ncsc-brief/ncsc-brief-minigame.js', SHARED_760],
];

for (const [file, cls, cap, jsFile, group] of cases) {
    test(`${cls}: ${cap}px cap lives in the shared framework sheet (X8), applies at desktop sizes, phones keep full width`, () => {
        assert.ok(!/\.console-window(?![\w-])/.test(read(file)), file + ' does not restyle .console-window');
        const css = read(FRAMEWORK);
        const re = new RegExp('\\.' + cls + ' \\.console-window(?:,\\s*\\.[\\w-]+ \\.console-window)*\\s*\\{ width: min\\((\\d+)px, 100%\\); \\}');
        const m = css.match(re);
        assert.ok(m !== null, 'cap rule present');
        assert.ok(Number(m[1]) === cap, 'cap is ' + cap);
        const media = enclosingMedia(css, m.index);
        assert.ok(media !== '', 'rule is inside a media query, not top level');
        // the matched rule lists exactly this scene's group, and the block holds no other .console-window selector
        const start = Math.max(css.lastIndexOf('}', m.index), css.lastIndexOf('{', m.index)) + 1;
        const list = css.slice(start, css.indexOf('{', m.index)).replace(/\/\*[\s\S]*?\*\//g, '');
        const sels = list.split(',').map((x) => x.trim()).filter(Boolean);
        const want = group.map((c) => '.' + c + ' .console-window');
        assert.ok(sels.slice().sort().join(' | ') === want.slice().sort().join(' | '), 'cap selector list is exactly: ' + want.join(', ') + ' (got ' + sels.join(', ') + ')');
        const body = enclosingMediaBody(css, m.index);
        assert.ok((body.match(/\.console-window(?![\w-])/g) || []).length === 3, 'the media block names .console-window exactly three times (cf, ncsc, sis)');
        // rules whose selector list names .console-window: exactly the two cap rules; unrelated rules in the block are fine (R1 m1)
        const capRules = [...body.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((r) => /\.console-window(?![\w-])/.test(r[1]));
        assert.ok(capRules.length === 2, 'the media block holds exactly two rules naming .console-window, got ' + capRules.length);
        assert.ok(media === '@media (min-width: 601px) and (min-height: 500.02px), (min-width: 1100px)', 'wide branch is 1100px (997x448 phones sit under it; 1099x500 is the boundary), got ' + media);
        for (const [w, h] of PHONES) assert.ok(mediaMatches(media, w, h) === false, `phone ${w}x${h} keeps full width`);
        for (const [w, h] of DESKTOPS) assert.ok(mediaMatches(media, w, h) === true, `desktop ${w}x${h} gets the cap`);
    });

    test(`${jsFile} sets the ${cls} class on the scene container`, () => {
        const js = read(jsFile);
        assert.ok(js.includes(cls), 'container class ' + cls + ' set in the scene');
        const code = js.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
        const call = new RegExp("^\\s*this\\.container\\.(classList\\.add\\('" + cls + "'\\)|className \\+= ' " + cls + "')", 'm');
        assert.ok(call.test(code), 'class is applied to this.container by a live (uncommented) call');
    });
}
