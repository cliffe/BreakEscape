// B9: SE scenes on phones keep their 16px frame and 100dvh, mail-client keeps Close in the header
// row, shredded-document clears the X, and mail-client / inbox-triage follow the pixel rules.
// Run with: node --test test/js/se-phone-chrome-css.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const css = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/css');
const read = (f) => readFileSync(join(css, f), 'utf8');
const mediaBlock = (f, query) => {
    const src = read(f);
    const i = src.indexOf(`@media ${query} {`);
    if (i < 0) return '';
    let d = 0;
    for (let j = src.indexOf('{', i); j < src.length; j++) {
        if (src[j] === '{') d++;
        else if (src[j] === '}' && --d === 0) return src.slice(i, j + 1);
    }
    return '';
};
const narrow = (f, sel) => {
    const m = read(f).match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}', 'g'));
    return (m || []).join('\n');
};

for (const [file, sel] of [
    ['engagement-report-minigame.css', '.engagement-report-game-container'],
    ['intel-board-minigame.css', '.intel-board-game-container'],
    ['osint-browser-minigame.css', '.osint-browser-game-container']]) {
    test(`${file} narrow rule keeps the 16px frame and 100dvh`, () => {
        const block = narrow(file, sel).split('\n').filter((l) => /100vw/.test(l) || /border-width/.test(l)).join('\n');
        const all = narrow(file, sel);
        assert.ok(/border-width:\s*16px/.test(all), 'border-width 16px');
        assert.ok(!/border-width:\s*(0|2px)\b/.test(all), 'no dropped frame');
        assert.ok(/height:\s*100dvh/.test(all), '100dvh');
        assert.ok(block.length > 0, 'narrow rule present');
    });
}

// D218: the X now sits in the console window's title bar, above the instruction bar, so the
// instruction no longer reserves 48px for it; equal side padding instead.
test('shredded-document instruction has even side padding now the X is in the title bar (D218)', () => {
    const m = read('shredded-document-minigame.css').match(/\.sdm-instruction\s*\{([^}]*)\}/);
    assert.ok(m && /padding:\s*8px 14px;/.test(m[1]), 'padding 8px 14px');
});

test('mail-client phone toolbar: Close in the header row, buttons on their own row', () => {
    const s = read('mail-client-minigame.css');
    assert.ok(/\.mail-client--phone \.mail-toolbar:not\(\.tri-toolbar\) \.se-overlay-close \{ order: 1; margin-left: auto; \}/.test(s), 'phone close order');
    assert.ok(/\.mail-client \.mail-toolbar:not\(\.tri-toolbar\) \.se-overlay-close \{ order: 1; margin-left: auto; \}/.test(s), 'narrow close order');
    assert.ok(/> \.mail-toolbar-actions \{ order: 2; \}/.test(s), 'actions on row two');
});

test('mail-client and inbox-triage have no radius or blurred shadow in the listed rules', () => {
    const mc = read('mail-client-minigame.css');
    assert.ok(!/border-radius:\s*(4|6|18|36)px/.test(mc), 'mail-client radius');
    assert.ok(!/0 12px 32px/.test(mc), 'phone blurred shadow');
    assert.ok(/box-shadow:\s*0 0 0 6px #0b0e18;/.test(mc), 'hard phone frame');
    const it = read('inbox-triage-minigame.css');
    assert.ok(!/border-radius:\s*(50%|999px)/.test(it), 'inbox-triage radius');
    assert.ok(!/border:\s*1px (solid|dashed) (var\(--ui-line|currentColor)/.test(it), 'inbox-triage 1px borders');
});

test('mail-client and inbox-triage sheets: no radius, blur, 1px border or outline anywhere', () => {
    for (const f of ['mail-client-minigame.css', 'inbox-triage-minigame.css']) {
        const s = read(f).replace(/\/\*[\s\S]*?\*\//g, '');
        const radii = (s.match(/border(-[a-z]+)*-radius:\s*([^;}]*)/g) || []).filter((d) => !/:\s*0(px)?(\s+0(px)?)*\s*$/.test(d));
        assert.ok(radii.length === 0, `${f}: radius ${radii[0]}`);
        assert.ok(!/filter:\s*blur|backdrop-filter/.test(s), `${f}: filter blur`);
        // Third length of a shadow layer is the blur; a bare 0 counts as a length.
        const blurred = (s.match(/(?<![a-z-])(box|text)-shadow:[^;}]*/g) || []).filter((d) => d.split(/,(?![^(]*\))/).some((layer) => {
            const nums = layer.replace(/^[^:]*:/, '').replace(/[;}]|!important/g, '').replace(/rgba?\([^)]*\)|hsla?\([^)]*\)|inset|#[0-9a-f]+/gi, '')
                .split(/\s+/).filter((t) => /^-?\d*\.?\d+([a-z]+)?$/i.test(t));
            // calc() or a var() that is not the trailing colour hides lengths from the token split: reject it
            if (/\b(calc|var)\(/.test(layer.replace(/\bvar\((?:[^()]|\([^)]*\))*\)\s*(!important)?\s*$/, ''))) return true;
            // a layer whose only value is a var() leaves no lengths to read: a var can hold any blur (R1 m3)
            if (nums.length < 2 && !/^\s*(?:none\s*)?(?:!important)?\s*$/i.test(layer.replace(/^[^:]*:/, '').replace(/\bnone\b/i, ''))) return true;
            if (nums.length < 2) return false;
            return nums.length >= 3 && parseFloat(nums[2]) > 0;
        }));
        assert.ok(blurred.length === 0, `${f}: blurred shadow ${blurred[0]}`);
        const thin = s.match(/border(-[a-z]+)*:\s*1px\b/g) || [];
        assert.ok(thin.length === 0, `${f}: 1px border ${thin[0]}`);
        const thinW = s.match(/border(-[a-z]+)*-width:\s*1px\b/g) || [];
        assert.ok(thinW.length === 0, `${f}: 1px border width ${thinW[0]}`);
        const outline = s.match(/(?<![a-z-])outline(-width)?:\s*(?!none|0\b)[^;}]*/g) || [];
        assert.ok(outline.filter((o) => /\b1px\b/.test(o)).length === 0, `${f}: 1px outline ${outline[0]}`);
    }
});

test('osint narrow frame drops the 92vh cap so it fills the viewport', () => {
    const b = mediaBlock('osint-browser-minigame.css', '(max-width: 700px)');
    assert.ok(/\.osint-browser-game-container \{[^}]*max-height:\s*none/.test(b), 'max-height none in the 700px block');
});

test('mail-client toolbar: Close stays in the header row at every width up to 1000px', () => {
    const blocks = {
        1000: mediaBlock('mail-client-minigame.css', '(max-width: 1000px)'),
        767: mediaBlock('mail-client-minigame.css', '(max-width: 767px)'),
    };
    const t = '.mail-client .mail-toolbar:not(.tri-toolbar)';
    assert.ok(blocks[1000].includes(`${t} .mail-account { flex: 1 1 calc(100% - 40px); }`), '1000px: account leaves room for the X');
    assert.ok(blocks[1000].includes(`${t} .se-overlay-close { order: 1; margin-left: auto; }`), '1000px: close order 1');
    const grouped = (sel, ind = '') => `${sel} > .mail-folders,\n${ind}${sel} > .mail-contacts-btn,\n${ind}${sel} > .mail-toolbar-actions { order: 2; }`;
    assert.ok(blocks[1000].includes(grouped(t, '    ')), '1000px: folders, contacts and actions all at order 2');
    assert.ok(!/\.mail-toolbar:not\(\.tri-toolbar\)(::after| \.se-overlay-close)/.test(blocks[767]), 'no duplicate scoped rules in the 767px block');
    const s = read('mail-client-minigame.css');
    assert.ok(!/:not\(\.tri-toolbar\)::after/.test(s), 'no row-break element');
    assert.ok(!/:not\(\.tri-toolbar\) \{ row-gap/.test(s), 'no row-gap override: every row gap stays 8px');
    assert.ok(!/height: 0; margin/.test(s), 'no negative-margin trick');
    const p = '.mail-client--phone .mail-toolbar:not(.tri-toolbar)';
    assert.ok(s.includes(`${p} .mail-account { flex: 1 1 calc(100% - 40px); }`), 'phone account leaves room for the X');
    assert.ok(s.includes(`${p} .se-overlay-close { order: 1; margin-left: auto; }`), 'phone close order 1');
    assert.ok(s.includes(grouped(p)), 'phone: folders, contacts and actions all at order 2');
});

test('the toolbar width arithmetic behind calc(100% - 40px) is pinned: 8px gap, 30px X, no side margin (B9 R3 m1)', () => {
    const s = read('mail-client-minigame.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const toolbar = s.match(/(?:^|\})\s*\.mail-toolbar \{([^}]*)\}/)?.[1] || '';
    assert.ok(/(?:^|[\s;])gap:\s*8px\s*;/.test(toolbar), 'base .mail-toolbar gap is 8px, got: ' + toolbar.trim().replace(/\s+/g, ' '));
    const fw = read('minigames-framework.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const x = fw.match(/(?:^|\})\s*\.se-overlay-close \{([^}]*)\}/)?.[1] || '';
    assert.ok(/(?:^|[\s;])width:\s*30px\s*;/.test(x), 'the X is 30px wide');
    assert.ok(/(?:^|[\s;])min-width:\s*30px\s*;/.test(x), 'the X min-width is 30px');
    assert.ok(/(?:^|[\s;])margin:\s*0\s*;/.test(x), 'the X has no margin');
    // 30 + 8 = 38 of the 40px that calc(100% - 40px) reserves, leaving 2px of slack
    assert.ok(!/(?:^|[\s;])margin-(left|right):\s*[1-9]/.test(x), 'the X has no side margin');
    // every mail-sheet rule on the toolbar or the X, base and inside media blocks, keeps the arithmetic (R1 m2)
    const bad = [];
    for (const r of s.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const sels = r[1].split(',').map((q) => q.replace(/^[\s\S]*\*\/|@media[^{]*$/g, '').trim());
        const onBar = sels.some((q) => /\.mail-toolbar$/.test(q));
        const onX = sels.some((q) => /\.se-overlay-close$/.test(q));
        if (!onBar && !onX) continue;
        for (const d of r[2].split(';').map((q) => q.trim()).filter(Boolean)) {
            const [prop, ...rest] = d.split(':'); const val = rest.join(':').trim();
            if (onBar && prop.trim() === 'gap' && val !== '8px') bad.push(sels.join(',') + ' { ' + d + ' }');
            if (onX && /^(width|min-width)$/.test(prop.trim())) bad.push(sels.join(',') + ' { ' + d + ' }');
            if (onX && /^margin-(left|right)$/.test(prop.trim()) && val !== 'auto') bad.push(sels.join(',') + ' { ' + d + ' }');
        }
    }
    assert.ok(bad.length === 0, 'mail-sheet toolbar/X rules change the arithmetic: ' + bad.join(' ; '));
});

test('wifi bars are border-box so the tallest bar fits its 14px meter', () => {
    const s = read('inbox-triage-minigame.css');
    assert.ok(/\.tri-wifi-bar \{[^}]*box-sizing:\s*border-box/.test(s), 'border-box');
    assert.ok(/\.tri-wifi-bars \{[^}]*height:\s*14px/.test(s) && /\.tri-wifi-bar-4 \{ height: 14px; \}/.test(s), '14px meter, 14px tallest');
});

const lum = (h) => {
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

test('intel-board empty note and unknown name reach 4.5:1 on their backgrounds', () => {
    const s = read('intel-board-minigame.css');
    const empty = s.match(/\.ib-empty \{[^}]*color:\s*(#[0-9a-f]{6})/i);
    assert.ok(empty, '.ib-empty has its own colour');
    assert.ok(ratio(empty[1], '#aa7446') >= 4.5, `.ib-empty on cork ${ratio(empty[1], '#aa7446').toFixed(2)}`);
    const unk = s.match(/\.ib-name\.is-unknown \{[^}]*color:\s*(#[0-9a-f]{6})/i);
    assert.ok(unk && ratio(unk[1], '#f5eeba') >= 4.5, 'unknown name on card paper');
    assert.ok(unk[1].toLowerCase() === '#3a2d20', 'unknown name darkened to #3a2d20');
});

test('inbox-triage: stacked verdict buttons grow to their content on phones (live 390x844 overlap)', () => {
    const block = mediaBlock('inbox-triage-minigame.css', '(max-width: 767px)');
    const rule = (block.match(/\.tri-verdict\s*\{([^}]*)\}/) || [])[1] || '';
    // In a column, a 0 flex-basis squashes each button to its 44px min-height and the text overflows
    assert.ok(/flex:\s*0 0 auto/.test(rule), 'narrow .tri-verdict sets flex: 0 0 auto, got: ' + rule.trim());
});

test('inbox-triage: on phones the verdict icon sits beside the word and the hint spans the button', () => {
    const block = mediaBlock('inbox-triage-minigame.css', '(max-width: 767px)');
    const rules = [...block.matchAll(/\.tri-verdict\s*\{([^}]*)\}/g)].map((m) => m[1]).join(';');
    assert.ok(/display:\s*grid/.test(rules) && /grid-template-columns:\s*auto 1fr/.test(rules), 'icon and word share a row');
    assert.ok(/\.tri-verdict \.tri-verdict-hint\s*\{[^}]*grid-column:\s*1 \/ -1/.test(block), 'hint spans both columns');
});
