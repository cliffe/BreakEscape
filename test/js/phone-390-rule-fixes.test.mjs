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

test('the VM launcher scroller starts below the 32px X at phone width', () => {
    const raw = readFileSync(join(root, 'css', 'vm-launcher-minigame.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const m = raw.match(/@media \(max-width: 559px\) \{\s*\.vm-launcher \{([^}]*)\}/);
    assert.ok(m, 'a phone-width rule for the scroller exists');
    const top = px(m[1], 'margin-top')[0] || 0;
    assert.ok(top >= 6, `the scroller margin-top ${top}px clears the X's 5.6px overhang`);
});

test('queued alerts text pluralises', async () => {
    const { queuedAlertsText } = await import('../../public/break_escape/js/minigames/siem/siem-dashboard-minigame.js');
    assert.ok(queuedAlertsText(0) === '0 alerts queued', 'zero');
    assert.ok(queuedAlertsText(1) === '1 alert queued', 'one');
    assert.ok(queuedAlertsText(2) === '2 alerts queued', 'two');
    const src = readFileSync(join(root, 'js/minigames/siem/siem-dashboard-minigame.js'), 'utf8');
    assert.ok(/queueCountEl\.textContent\s*=\s*queuedAlertsText\(/.test(src), 'count set with textContent via the helper');
});
