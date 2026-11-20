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

test('shredded-document instruction has right padding for the X', () => {
    const m = read('shredded-document-minigame.css').match(/\.sdm-instruction\s*\{([^}]*)\}/);
    assert.ok(m && /padding:\s*8px 48px 8px 14px/.test(m[1]), 'right padding 48px');
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
        const blurred = (s.match(/(?<![a-z-])(box|text)-shadow:[^;]*;/g) || []).filter((d) => d.split(/,(?![^(]*\))/).some((layer) => {
            const nums = layer.replace(/^[^:]*:/, '').replace(/rgba?\([^)]*\)|hsla?\([^)]*\)|inset|#[0-9a-f]+/gi, '')
                .split(/\s+/).filter((t) => /^-?\d*\.?\d+(px)?$/.test(t));
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
    assert.ok(blocks[1000].includes(`${t} .mail-account { flex: 1 1 0; }`), '1000px: account flex 1 1 0');
    assert.ok(blocks[1000].includes(`${t} .se-overlay-close { order: 1; margin-left: auto; }`), '1000px: close order 1');
    assert.ok(/::after \{ content: ''; order: 1; flex: 0 0 100%; height: 0; \}/.test(blocks[1000]), '1000px: row break');
    assert.ok(/> \.mail-toolbar-actions \{ order: 2; \}/.test(blocks[1000]), '1000px: actions on row two');
    assert.ok(new RegExp(`${t.replace(/[.()]/g, '\\$&')} \\{ row-gap: 4px; \\}`).test(blocks[1000]), '1000px: row-gap 4px');
    assert.ok(!/\.mail-toolbar:not\(\.tri-toolbar\)(::after| \.se-overlay-close)/.test(blocks[767]), 'no duplicate scoped rules in the 767px block');
    const s = read('mail-client-minigame.css');
    assert.ok(!/height: 0; margin/.test(s), 'no negative-margin trick on the row break');
    const p = '.mail-client--phone .mail-toolbar:not(.tri-toolbar)';
    assert.ok(s.includes(`${p} { row-gap: 4px; }`), 'phone row-gap 4px');
    assert.ok(s.includes(`${p} .mail-account { flex: 1 1 0; }`), 'phone account flex 1 1 0');
    assert.ok(/mail-client--phone[^{]*::after \{ content: ''; order: 1; flex: 0 0 100%; height: 0; \}/.test(s), 'phone row break');
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
