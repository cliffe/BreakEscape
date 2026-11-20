// Command board on phones: the body is the only scroller, the entry bar stays visible,
// the dev note is gone and the UNKNOWN badge is readable (sweep 3 B2).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape');
const css = readFileSync(join(root, 'css/command-board-minigame.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const js = readFileSync(join(root, 'js/minigames/command-board/command-board-minigame.js'), 'utf8');

function block(query) {
    const at = css.indexOf(query);
    assert.ok(at >= 0, 'has ' + query);
    let depth = 0;
    for (let i = css.indexOf('{', at); i < css.length; i++) {
        if (css[i] === '{') depth++;
        if (css[i] === '}' && --depth === 0) return css.slice(at, i + 1);
    }
    return '';
}
function rule(text, sel) {
    const m = new RegExp('(?:^|[}\\s])' + sel.replace(/[.]/g, '\\.') + '\\s*\\{([^}]*)\\}').exec(text);
    return m ? m[1] : '';
}

for (const q of ['@media (max-height: 520px)', '@media (max-width: 600px)']) {
    test('board body is the only scroller under ' + q, () => {
        const b = block(q);
        assert.ok(/overflow:\s*hidden/.test(rule(b, '.cb-panel')), 'panel does not scroll');
        const body = rule(b, '.cb-body');
        assert.ok(/overflow-y:\s*auto/.test(body), 'body scrolls');
        assert.ok(/min-height:\s*0/.test(body), 'body can shrink');
        assert.ok(/flex:\s*1 1 auto/.test(body), 'body shrinks to leave the entry bar');
    });
}

test('entry bar is pinned in the short-window block', () => {
    assert.ok(/flex:\s*none/.test(rule(block('@media (max-height: 520px)'), '.cb-entry-bar')), 'entry bar flex none');
});

test('player-facing dev note is replaced', () => {
    assert.ok(!js.includes('auto-updating - global state driven'), 'old note gone');
    assert.ok(js.includes('Updates as the incident develops'), 'new note present');
});

test('UNKNOWN badge meets 4.5:1 and keeps its text label', () => {
    const m = /\.cb-status-badge\.state-unknown\s*\{[^}]*background:\s*(#\w{6});[^}]*color:\s*(#\w{6})/.exec(css);
    assert.ok(m, 'rule found');
    const lum = (h) => {
        const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
            .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const [a, b] = [lum(m[1]), lum(m[2])].sort((x, y) => y - x);
    assert.ok((a + 0.05) / (b + 0.05) >= 4.5, 'contrast at least 4.5');
    assert.ok(js.includes('badge.textContent = rowStatus.label'), 'badge carries a text label');
});

// Round 1 fixes
test('B1: phone body rows keep their content height', () => {
    const body = rule(block('@media (max-width: 600px)'), '.cb-body');
    assert.ok(/grid-auto-rows:\s*max-content/.test(body), 'rows are max-content');
});

test('M1: phone timeline is capped so status stays near', () => {
    const list = rule(block('@media (max-width: 600px)'), '.cb-timeline-list');
    assert.ok(/max-height:\s*45dvh/.test(list), '45dvh cap');
    assert.ok(/overflow-y:\s*auto/.test(list), 'list scrolls inside the cap');
});

test('m1: very short layouts let the panel scroll to POST', () => {
    const b = block('@media (max-height: 260px)');
    assert.ok(/overflow-y:\s*auto/.test(rule(b, '.cb-panel')), 'panel scrolls');
    assert.ok(/flex:\s*0 0 auto/.test(rule(b, '.cb-body')), 'body keeps its content height');
});

test('m2: pixel-scroll sits on the body, not the panel', () => {
    assert.ok(/class="cb-body pixel-scroll"/.test(js), 'body has pixel-scroll');
    assert.ok(/class="cb-panel"/.test(js), 'panel has none');
});

test('m3: subtitle is readable and hidden in short windows', () => {
    const m = /\.cb-section-subtitle\s*\{[^}]*color:\s*(#\w{6})/.exec(css);
    assert.ok(m && m[1] === '#8fa3c0', 'subtitle colour lifted');
    assert.ok(/display:\s*none/.test(rule(block('@media (max-height: 520px)'), '.cb-section-subtitle')), 'hidden when short');
});

test('m4: phone landscape keeps input and POST on one row', () => {
    const b = block('@media (max-width: 600px) and (max-height: 520px)');
    assert.ok(/grid-template-columns:\s*minmax\(0, 1fr\) 120px/.test(rule(b, '.cb-entry-bar')), 'two columns');
});
