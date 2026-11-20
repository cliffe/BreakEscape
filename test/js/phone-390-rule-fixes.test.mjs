// Phone 390x844 rule fixes (fix/phone-390-rule-fixes): CSS-source pins and the queue plural.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public/break_escape');
const read = (f) => readFileSync(join(root, 'css', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
// Every rule whose selector list names class `cls`.
function rulesFor(file, cls) {
    const re = /([^{}]+)\{([^{}]*)\}/g;
    const t = read(file);
    const tok = new RegExp('\\.' + cls.replace(/^\./, '') + '(?![\\w-])');
    const out = [];
    let m;
    while ((m = re.exec(t))) if (m[1].split(',').some((s) => tok.test(s))) out.push({ sel: m[1].trim(), body: m[2] });
    return out;
}
const px = (b, prop) => [...b.matchAll(new RegExp('(?:^|[;\\s])' + prop + '\\s*:\\s*(\\d+)px', 'g'))].map((m) => Number(m[1]));

test('VM launcher code chips are VT323 at 18px or more', () => {
    const rs = rulesFor('vm-launcher-minigame.css', 'standalone-instructions').filter((r) => /code\b/.test(r.sel));
    assert.ok(rs.length > 0, 'a code chip rule exists');
    const body = rs.map((r) => r.body).join(';');
    assert.ok(/font-family:\s*'VT323'/.test(body), 'chip names VT323');
    const sizes = px(body, 'font-size');
    assert.ok(sizes.length > 0 && sizes.every((s) => s >= 18), `chip font-size ${sizes} is 18 or more`);
});

test('SIEM GNF text is on the 16/24/32 scale', () => {
    const t = read('siem-dashboard-minigame.css');
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(t))) {
        if (!/GNF/.test(m[2])) continue;
        for (const s of px(m[2], 'font-size')) assert.ok([16, 24, 32].includes(s), `(${m[1].trim()}) GNF ${s}px`);
    }
    for (const cls of ['siem-time', 'siem-source', 'siem-description', 'siem-queue-count', 'siem-queue-text']) {
        for (const r of rulesFor('siem-dashboard-minigame.css', cls)) {
            for (const s of px(r.body, 'font-size')) assert.ok([16, 24, 32].includes(s), `.${cls} (${r.sel}) ${s}px`);
        }
    }
});

test('VM launcher and PC monitor X are at least 32px', () => {
    const vm = rulesFor('vm-launcher-minigame.css', 'minigame-close-button');
    assert.ok(vm.length > 0, 'vm launcher X rule exists');
    const vb = vm.map((r) => r.body).join(';');
    assert.ok(px(vb, 'width').every((n) => n >= 32) && px(vb, 'width').length > 0, 'vm X width >= 32');
    assert.ok(px(vb, 'height').every((n) => n >= 32) && px(vb, 'height').length > 0, 'vm X height >= 32');
    const pc = rulesFor('pc-monitor.css', 'pc-monitor-close').filter((r) => !/::after/.test(r.sel));
    const pb = pc.map((r) => r.body).join(';');
    assert.ok(px(pb, 'width')[0] >= 32 && px(pb, 'height')[0] >= 32, 'pc X is >= 32 square');
    assert.ok(/-\s*32px/.test(pb), 'pc X top centring uses 32px');
});

test('queued alerts text pluralises', async () => {
    const { queuedAlertsText } = await import('../../public/break_escape/js/minigames/siem/siem-dashboard-minigame.js');
    assert.ok(queuedAlertsText(0) === '0 alerts queued', 'zero');
    assert.ok(queuedAlertsText(1) === '1 alert queued', 'one');
    assert.ok(queuedAlertsText(2) === '2 alerts queued', 'two');
    const src = readFileSync(join(root, 'js/minigames/siem/siem-dashboard-minigame.js'), 'utf8');
    assert.ok(/queueCountEl\.textContent\s*=\s*queuedAlertsText\(/.test(src), 'count set with textContent via the helper');
});

// fix/siem-wrap-footer: wrapped descriptions and a compact phone footer.
const mediaBlock = (file, query) => {
    const t = read(file);
    const i = t.indexOf(query);
    assert.ok(i >= 0, `media query ${query} exists`);
    let depth = 0, j = t.indexOf('{', i);
    const start = j;
    for (; j < t.length; j++) {
        if (t[j] === '{') depth++;
        else if (t[j] === '}' && --depth === 0) break;
    }
    return t.slice(start + 1, j);
};

test('SIEM descriptions and queue text wrap instead of ellipsising', () => {
    for (const cls of ['siem-description', 'siem-queue-text']) {
        const base = rulesFor('siem-dashboard-minigame.css', cls).filter((r) => r.sel.trim() === '.' + cls);
        assert.ok(base.length > 0, `.${cls} base rule exists`);
        const b = base.map((r) => r.body).join(';');
        assert.ok(/white-space:\s*normal/.test(b), `.${cls} wraps`);
        assert.ok(!/text-overflow:\s*ellipsis/.test(b), `.${cls} has no ellipsis`);
        assert.ok(/overflow-wrap:\s*anywhere/.test(b), `.${cls} breaks long tokens`);
        assert.ok(!/white-space:\s*nowrap/.test(b), `.${cls} is not nowrap`);
    }
});

test('SIEM alert row grows with its message and keeps cells centred', () => {
    const b = rulesFor('siem-dashboard-minigame.css', 'siem-alert-row').filter((r) => r.sel.trim() === '.siem-alert-row').map((r) => r.body).join(';');
    assert.ok(/min-height:\s*60px/.test(b) && !/(^|[;\s])height:/.test(b), 'row has a min-height, no fixed height');
    assert.ok(/flex-shrink:\s*0/.test(b), 'row never shrinks below its content');
    assert.ok(/align-items:\s*center/.test(b), 'cells stay aligned on the row centre');
    const q = rulesFor('siem-dashboard-minigame.css', 'siem-queue-item').map((r) => r.body).join(';');
    assert.ok(/min-height:\s*42px/.test(q) && !/(^|[;\s])height:/.test(q), 'queue item grows too');
});

test('SIEM phone footer is compact: GNF 16, two lines, no min-height', () => {
    const m = mediaBlock('siem-dashboard-minigame.css', '@media (max-width: 600px)');
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let mm, body = '';
    while ((mm = re.exec(m))) if (/\.siem-status-bar(?![\w-])/.test(mm[1]) && !/>/.test(mm[1])) body += mm[2];
    assert.ok(body.length > 0, 'phone status bar rule exists');
    assert.ok(/font-size:\s*16px/.test(body), 'footer is GNF 16');
    assert.ok(/display:\s*grid/.test(body), 'footer is a two-column grid');
    assert.ok(/min-height:\s*0/.test(body), 'footer drops the 48px min-height');
    const line = px(body, 'line-height')[0];
    const pad = body.match(/padding:\s*(\d+)px/);
    assert.ok(line && line <= 20 && pad, 'line-height and padding are set');
    // two lines + row gap + padding + the 2px top border
    const h = 2 * line + 2 + 2 * Number(pad[1]) + 2;
    assert.ok(h <= 70, `footer height ${h}px is at most half of the old 140px`);
    assert.ok(/grid-column:\s*1\s*\/\s*-1/.test(m.slice(m.indexOf('nth-child(3)'))), 'time remaining spans its own line');
});

test('SIEM footer spans stay text-only (no new controls to size)', () => {
    const js = readFileSync(join(root, 'js/minigames/siem/siem-dashboard-minigame.js'), 'utf8');
    const bar = js.slice(js.indexOf('class="siem-status-bar"'), js.indexOf('</div>', js.indexOf('class="siem-status-bar"')));
    assert.ok(!/<button/.test(bar), 'no buttons in the footer');
    assert.ok((bar.match(/<span/g) || []).length === 3, 'three spans: pending, clock, remaining');
});
