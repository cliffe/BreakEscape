import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape');
const read = (p) => readFileSync(join(root, p), 'utf8');

const DESKTOP = '@media (min-width: 601px) and (min-height: 500.02px), (min-width: 1000px)';

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

const cases = [
    ['css/concern-form-minigame.css', 'cf-minigame-container', 760, 'js/minigames/concern-form/concern-form-minigame.js'],
    ['css/sis-config-threshold-minigame.css', 'sis-threshold-minigame-container', 800, 'js/minigames/sis-config-threshold/sis-config-threshold-minigame.js'],
    ['css/ncsc-brief-minigame.css', 'ncsc-minigame-container', 760, 'js/minigames/ncsc-brief/ncsc-brief-minigame.js'],
];

for (const [file, cls, cap, jsFile] of cases) {
    test(`${file}: ${cap}px cap applies only inside the desktop media query, phones keep full width`, () => {
        const css = read(file);
        const re = new RegExp('\\.' + cls + ' \\.console-window \\{ width: min\\((\\d+)px, 100%\\); \\}');
        const m = css.match(re);
        assert.ok(m !== null, 'cap rule present');
        assert.ok(Number(m[1]) === cap, 'cap is ' + cap);
        const media = enclosingMedia(css, m.index);
        assert.ok(media === DESKTOP, 'rule sits inside ' + DESKTOP + ', found: "' + media + '"');
    });

    test(`${jsFile} sets the ${cls} class on the scene container`, () => {
        const js = read(jsFile);
        assert.ok(js.includes(cls), 'container class ' + cls + ' set in the scene');
        const code = js.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
        const call = new RegExp("^\\s*this\\.container\\.(classList\\.add\\('" + cls + "'\\)|className \\+= ' " + cls + "')", 'm');
        assert.ok(call.test(code), 'class is applied to this.container by a live (uncommented) call');
    });
}
