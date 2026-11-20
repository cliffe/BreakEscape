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
    const m = new RegExp(query.replace(/[().]/g, '\\$&') + '\\s*\\{').exec(css);
    assert.ok(m, 'has ' + query);
    const at = m.index;
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
    // the last max-height in the whole 600px block (any .cb-timeline-list rule in it) wins the cascade,
    // so a later 25dvh or other value leaking in here must fail (B2 R3 m2)
    const all = block('@media (max-width: 600px)');
    // selector lists count too: `.cb-timeline-list, .x { ... }` styles the list (R1 m5)
    const caps = [...all.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
        .filter((r) => r[1].split(',').some((s) => /\.cb-timeline-list\s*$/.test(s)))
        .flatMap((r) => [...r[2].matchAll(/max-height:\s*([^;}]+)/g)].map((d) => d[1].trim()));
    assert.ok(caps.length >= 2 && caps[caps.length - 1] === '45dvh', 'the last timeline max-height in the plain 600px block is 45dvh, got ' + caps.join(' then '));
    assert.ok(/overflow-y:\s*auto/.test(list), 'list scrolls inside the cap');
});

test('m1: very short layouts let the panel scroll to POST', () => {
    const b = block('@media (max-height: 260px)');
    assert.ok(/overflow-y:\s*auto/.test(rule(b, '.cb-panel')), 'panel scrolls');
    assert.ok(rule(b, '.cb-body') === '', 'body rule left alone so the bar stays pinned');
});

test('m2: pixel-scroll sits on the body and the panel', () => {
    assert.ok(/class="cb-body pixel-scroll"/.test(js), 'body has pixel-scroll');
    assert.ok(/class="cb-panel pixel-scroll"/.test(js), 'panel has it for the short-height scroll');
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

// Round 2 fixes
// Sweep 6 (B2 R3 m1): the 25dvh list cap of round 2 is gone. At 568x320 it showed one whole
// tile; the combined block now puts the timeline beside status so the list takes the body's height.
test('R2 m2 (sweep 6): phone landscape has no 25dvh cap; the list fills a side column', () => {
    const b = block('@media (max-width: 600px) and (max-height: 520px)');
    const list = rule(b, '.cb-timeline-list');
    assert.ok(!/25d?vh/.test(b), 'no 25vh or 25dvh cap left in the combined block');
    assert.ok(/max-height:\s*none/.test(list), 'the 45dvh cap is lifted');
    assert.ok(/flex:\s*1 1 auto/.test(list), 'the list takes the column height');
});

test('sweep 6: phone landscape puts timeline and status side by side without a body scroll', () => {
    const b = block('@media (max-width: 600px) and (max-height: 520px)');
    const body = rule(b, '.cb-body');
    assert.ok(/grid-template-columns:\s*\d+fr \d+fr/.test(body), 'two columns, not the stacked 1fr');
    assert.ok(/grid-auto-rows:\s*minmax\(0, 1fr\)/.test(body), 'the row is the body height, not max-content');
    assert.ok(/overflow-y:\s*hidden/.test(body), 'the body does not scroll');
    assert.ok(/border-right:\s*2px solid/.test(rule(b, '.cb-timeline-col')), 'divider is on the right again');
    assert.ok(/border-bottom:\s*0/.test(rule(b, '.cb-timeline-col')), 'no stacked divider');
});

test('sweep 6: phone landscape compacts tiles and the entry bar so two tiles fit', () => {
    const b = block('@media (max-width: 600px) and (max-height: 520px)');
    assert.ok(/font-size:\s*16px/.test(rule(b, '.cb-entry-timestamp')), 'timestamp on the GNF 16 floor');
    assert.ok(/line-height:\s*16px/.test(rule(b, '.cb-entry-timestamp')), 'whole-pixel line');
    assert.ok(/padding:\s*4px 6px/.test(rule(b, '.cb-entry-tile')), 'tile padding trimmed');
    assert.ok(/min-height:\s*0/.test(rule(b, '.cb-entry-bar')), 'entry bar sheds its 50px floor');
    assert.ok(/min-height:\s*40px/.test(rule(b, '.cb-post-btn')), 'POST stays at least 40px tall');
    assert.ok(/min-width:\s*0/.test(rule(b, '.cb-status-badge')), 'status badge can narrow in the side column');
});

test('R2 m3: the 45dvh cap keeps its vh fallback just before it', () => {
    assert.ok(/max-height:\s*45vh;\s*max-height:\s*45dvh/.test(css), '45vh then 45dvh');
});

test('R2 m4: media blocks keep their cascade order', () => {
    const at = (q) => new RegExp(q.replace(/[().]/g, '\\$&') + '\\s*\\{').exec(css).index;
    const order = ['@media (max-height: 520px)', '@media (max-width: 600px)',
        '@media (max-width: 600px) and (max-height: 520px)', '@media (max-height: 260px)'].map(at);
    assert.ok(order.every((v, i) => i === 0 || order[i - 1] < v), 'order 520, 600, combined, 260');
});
