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

test('the VM launcher X rule matches the DOM the framework builds (parent is the container, not the frame)', () => {
    const vmJs = readFileSync(join(root, 'js/minigames/vm-launcher/vm-launcher-minigame.js'), 'utf8');
    const baseJs = readFileSync(join(root, 'js/minigames/framework/base-minigame.js'), 'utf8');
    assert.ok(/static closeInsideFrame\s*=\s*true/.test(vmJs), 'the scene places the X over its frame');
    const cls = (vmJs.match(/container\.classList\?*\.add\('([\w-]+)'\)/) || [])[1];
    assert.ok(cls === 'vm-launcher-minigame', `the scene tags its container (${cls})`);
    // Outside console mode the framework's template makes the X a direct child of the container, before any frame
    assert.ok(/\} else this\.container\.innerHTML = `\s*<button class="minigame-close-button" id="minigame-close"/.test(baseJs), 'the X is a direct child of the container');
    assert.ok(!/consoleWindow\s*=\s*true/.test(vmJs), 'the VM launcher is not a console window (whose X lives in the titlebar)');
    const sels = rulesFor('vm-launcher-minigame.css', 'minigame-close-button').map((r) => r.sel);
    assert.ok(sels.length > 0, 'a rule for the X exists');
    for (const sel of sels) {
        assert.ok(!/vm-launcher-frame\s*>\s*\.minigame-close-button/.test(sel), `(${sel}) the X is never a child of the frame`);
    }
    assert.ok(sels.some((s) => /\.vm-launcher-minigame\s*>\s*\.minigame-close-button/.test(s)), 'the rule targets the container child');
});

test('the compact PC bezel strip holds the 32px X with 2px clear, and the SIEM queue count stays one line', async () => {
    const { PC_BEZEL } = await import('../../public/break_escape/js/utils/pc-monitor.js');
    assert.ok(PC_BEZEL.compact.top >= 36 && PC_BEZEL.full.top >= 36, `strips ${PC_BEZEL.compact.top}/${PC_BEZEL.full.top} are 36 or more`);
    const q = rulesFor('siem-dashboard-minigame.css', 'siem-queue-count').filter((r) => /nowrap/.test(r.body));
    assert.ok(q.length > 0 && px(q[0].body, 'font-size')[0] === 16, 'the narrow-pane band is 16px, nowrap');
});

test('the 16px SIEM queue band ends at 839px (24px fits with 8px to spare from 840px)', () => {
    const raw = readFileSync(join(root, 'css', 'siem-dashboard-minigame.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const m = raw.match(/@media \(min-width: 601px\) and \(max-width: (\d+)px\) \{\s*\.siem-queue-count \{[^}]*white-space: nowrap/);
    assert.ok(m, 'the nowrap band is a 601px+ media query');
    assert.ok(m[1] === '839', `the band ends at ${m[1]}px, not 839`);
    assert.ok(!/max-width: 1100px\) \{\s*\.siem-queue-count/.test(raw), 'the old band to 1100px is gone');
});

test('the VM launcher scroller starts below the 32px X at phone width, from the shared device-frame title geometry', () => {
    // K3: the phone title is 16px on a 24px line, wrapped where needed, with the base 12px margin. The scroller
    // top is bezel + gap + line + margin, and must sit at or below the drawn X's bottom (bezel + gap + 32px).
    const strip = (f) => readFileSync(join(root, 'css', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const frame = strip('device-frame.css');
    assert.ok(!/@media[^{]*\{[^@]*\.device-frame-title\s*\{[^}]*(margin|font-size|line-height)/.test(frame), 'no media query on the title row changes size, line or margin');
    const base = frame.match(/\.device-frame > \.device-frame-title \{([^}]*)\}/)[1];
    const margin = parseFloat(base.match(/margin:\s*0 0 (\d+)px/)[1]);
    const line = parseFloat(base.match(/line-height:\s*(\d+)px/)[1]);
    const bezel = parseFloat(frame.match(/\.device-frame \{[^}]*?border:\s*(\d+)px solid transparent/)[1]);
    const gap = parseFloat(frame.match(/--device-frame-gap:\s*(\d+)px/)[1]);
    const xSize = parseFloat(strip('vm-launcher-minigame.css').match(/\.vm-launcher-minigame > \.minigame-close-button \{[^}]*?width:\s*(\d+)px/)[1]);
    const scrollerTop = bezel + gap + line + margin;
    assert.ok(scrollerTop >= bezel + gap + xSize, `the scroller top ${scrollerTop}px is above the X bottom ${bezel + gap + xSize}px`);
    const launcher = strip('vm-launcher-minigame.css');
    assert.ok(!/@media \(max-width: 559px\) \{\s*\.vm-launcher \{[^}]*margin-top/.test(launcher), 'no phone .vm-launcher margin-top is left to double the gap');
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
        // The first rule for the class is the base rule (the 1239px query comes later and
        // also says normal/anywhere, so take only the base one for the positive checks)
        const base = rulesFor('siem-dashboard-minigame.css', cls).filter((r) => r.sel.trim() === '.' + cls);
        assert.ok(base.length > 0, `.${cls} base rule exists`);
        const b = base[0].body;
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

test('SIEM phone footer declared values add up to a compact bar (a declared-values check, not a layout measurement)', () => {
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

test('SIEM desktop host column fits FIREWALL-CORE and FILESERVER-02 (154px at GNF 16)', () => {
    const b = rulesFor('siem-dashboard-minigame.css', 'siem-alert-row').find((r) => r.sel.trim() === '.siem-alert-row').body;
    const cols = b.match(/grid-template-columns:\s*([^;]+);/)[1].trim().split(/\s+/);
    assert.ok(/^\d+px$/.test(cols[2]) && parseInt(cols[2], 10) >= 156, `host track ${cols[2]} is at least 156px`);
});

test('SIEM footer spans stay text-only (no new controls to size)', () => {
    const js = readFileSync(join(root, 'js/minigames/siem/siem-dashboard-minigame.js'), 'utf8');
    const bar = js.slice(js.indexOf('class="siem-status-bar"'), js.indexOf('</div>', js.indexOf('class="siem-status-bar"')));
    assert.ok(!/<button/.test(bar), 'no buttons in the footer');
    assert.ok((bar.match(/<span/g) || []).length === 3, 'three spans: pending, clock, remaining');
});

// fix/siem-wrap-footer R2 m1: the two-line layout takes over before the description column
// drops below about 200px. Wide grid: 70 86 156 _ 200 and four 10px gaps leave the description
// the rest. Measured at 1280: 236px (row content 788px), so the row content is 552 + desc and
// shrinks 0.7px per viewport px (7fr of 10fr).
test('SIEM: the narrow layout starts at 1239px, so the wide description column stays 200px or more, and 1280 is wide', () => {
    const f = 'siem-dashboard-minigame.css';
    const BREAK = 1239;
    const wide = rulesFor(f, 'siem-alert-row').find((r) => r.sel.trim() === '.siem-alert-row').body;
    const tracks = /grid-template-columns:\s*70px 86px 156px minmax\(0, 1fr\) 200px/.test(wide);
    assert.ok(tracks, 'the wide grid is 70 86 156 1fr 200');
    const fixed = 70 + 86 + 156 + 200 + 4 * 10;
    const descAt = (vw) => 236 + (vw - 1280) * 0.7;
    assert.ok(fixed === 552, 'fixed tracks and gaps are 552px');
    assert.ok(descAt(BREAK + 1) >= 200, `description at ${BREAK + 1}px is ${descAt(BREAK + 1)}px, 200 or more`);
    assert.ok(BREAK < 1280, 'the two-line layout ends below 1280, so 1280 stays wide');
    assert.ok(descAt(1280) > descAt(BREAK + 1), '1280 is wider than the narrowest wide layout');
    const css = read(f);
    assert.ok(css.includes('@media (max-width: ' + BREAK + 'px)'), 'the two-line query is max-width ' + BREAK);
    assert.ok(!css.includes('@media (min-width: 601px) and (max-width: ' + BREAK + 'px)'), 'the queue-count band has its own cut (839), not the row breakpoint');
    assert.ok(!/max-width:\s*1100px/.test(css), 'no query still uses 1100px');
});

test('SIEM queue items grow to their text and the badge keeps its size (live regression pins)', () => {
    const item = rulesFor('siem-dashboard-minigame.css', 'siem-queue-item').filter((r) => r.sel.trim() === '.siem-queue-item').map((r) => r.body).join(';');
    assert.ok(!/(^|[;\s])height:/.test(item), 'queue item has no fixed height');
    assert.ok(/flex-shrink:\s*0/.test(item), 'queue item never shrinks inside the flex list');
    const sev = rulesFor('siem-dashboard-minigame.css', 'siem-queue-sev').filter((r) => r.sel.trim() === '.siem-queue-sev').map((r) => r.body).join(';');
    assert.ok(/flex-shrink:\s*0/.test(sev), 'badge never shrinks');
    assert.ok(/min-width:\s*56px/.test(sev), 'badge keeps its full width');
    const raw = read('siem-dashboard-minigame.css');
    const list = rulesFor('siem-dashboard-minigame.css', 'siem-queue-list').filter((r) => r.sel.trim() === '.siem-queue-list').map((r) => r.body).join(';');
    assert.ok(/container-type:\s*inline-size/.test(list), 'the queue list itself is the size container');
    const m = raw.match(/@container \(max-width: (\d+)px\) \{\s*\.siem-queue-item \{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/);
    assert.ok(m !== null, 'narrow queue stacks the badge above the text');
    const at = raw.indexOf('@container');
    assert.ok(at > raw.lastIndexOf('.siem-queue-item {', at) && raw.lastIndexOf('.siem-queue-item {', at) >= 0 && at > raw.indexOf('.siem-queue-sev {'), 'the stacked rule comes after the base item and badge rules so it wins');
    const blockEnd = raw.indexOf('\n}', at);
    assert.ok(!/(^|\n)\.siem-queue-(item|sev) \{/.test(raw.slice(blockEnd)), 'no base item or badge rule after the stacked block can override it');
    assert.ok(Number(m[1]) >= 199, 'stacks before the text column drops under about 120px');
});
