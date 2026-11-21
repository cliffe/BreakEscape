// m01 gate playtest minors: m1 (CyberChef update banner) and m12 (configuration prompt style).
// CyberChef 10.19.4 writes "Last build: ... ago - Version 10 is here!" into #notice with no
// option to turn it off, so the vendored page hides #notice itself.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const chefPath = process.env.CYBERCHEF_COPY || join(root, 'public/break_escape/assets/cyberchef/CyberChef_v10.19.4.html');
const chef = readFileSync(chefPath, 'utf8');
const css = readFileSync(join(root, 'public/break_escape/css/player_preferences.css'), 'utf8');

test('CyberChef update banner (#notice) is hidden in the vendored page', () => {
    const tag = chef.match(/<span id="notice"[^>]*>/);
    assert.ok(tag !== null, '#notice span present');
    assert.ok(/style="[^"]*display:\s*none/.test(tag[0]), '#notice carries display:none: ' + tag[0]);
});

test('CyberChef notice wrapper is kept so the header layout is stock', () => {
    assert.ok(chef.includes('id="notice-wrapper"'), 'notice wrapper kept');
});

test('CyberChef page explains the #notice edit in a comment beside it', () => {
    const i = chef.indexOf('<span id="notice"');
    assert.ok(i > 0, '#notice present');
    const c = chef.lastIndexOf('<!-- Break Escape:', i);
    assert.ok(c >= 0, 'Break Escape comment precedes the span');
    const between = chef.slice(c, i);
    assert.ok(/upgrad/.test(between), 'comment mentions upgrading');
    assert.ok(between.indexOf('-->') >= 0 && between.indexOf('-->') === between.lastIndexOf('-->'), 'one comment closes before the span');
});

// Parse the sheet into [selectorList, declarations] pairs (comments stripped, @media bodies flattened).
function parseRules(text) {
    const clean = text.replace(/\/\*[\s\S]*?\*\//g, '');
    const out = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(clean)) !== null) {
        const sels = m[1].trim().split(',').map(x => x.trim().replace(/\s+/g, ' '));
        out.push({ sels, body: m[2] });
    }
    return out;
}
const rules = parseRules(css);

// All declaration bodies whose selector list contains exactly `sel` (never a substring match).
function rule(sel) {
    const hits = rules.filter(r => r.sels.includes(sel));
    assert.ok(hits.length > 0, sel + ' rule exists');
    return hits.map(r => r.body).join(';');
}

// Blur radius found in a shadow value: any 3rd length above 0, or a blur() filter.
function blurIn(prop, value) {
    const v = value.replace(/rgba?\([^)]*\)|hsla?\([^)]*\)|#[0-9a-f]{3,8}/gi, ' ');
    if (/\bblur\(/.test(v)) return true;
    const parts = [];
    if (/drop-shadow\(/.test(v)) {
        for (const m of v.matchAll(/drop-shadow\(([^)]*)\)/g)) parts.push(m[1]);
    } else if (/(box|text)-shadow/.test(prop) || /^--ui-(text-glow|glow)/.test(prop)) {
        parts.push(...v.split(','));
    }
    return parts.some(p => {
        const lens = (p.match(/-?\d*\.?\d+(?:px|em|rem)?(?![\w-])/g) || []).filter(x => !/^inset$/.test(x));
        return lens.length >= 3 && parseFloat(lens[2]) > 0;
    });
}
function blurredDecls(ruleList) {
    const bad = [];
    for (const r of ruleList) {
        for (const d of r.body.split(';')) {
            const i = d.indexOf(':');
            if (i < 0) continue;
            const prop = d.slice(0, i).trim();
            const val = d.slice(i + 1).trim();
            if (/^(box-shadow|text-shadow|filter|backdrop-filter|-webkit-filter)$/.test(prop) || /^--ui-(text-glow|glow-filter)$/.test(prop)) {
                if (blurIn(prop, val)) bad.push(r.sels.join(',') + ' { ' + prop + ': ' + val + ' }');
            }
        }
    }
    return bad;
}

test('.selection-required is GNF 16px on a whole-pixel line box (not inherited 19.2px)', () => {
    const r = rule('.selection-required');
    assert.ok(/font-family:\s*'GNF'/.test(r), 'GNF font');
    assert.ok(/font-size:\s*16px/.test(r), '16px');
    assert.ok(/line-height:\s*24px/.test(r), 'whole-pixel line box');
});

test('.config-prompt is pixel styled: 2px border, no radius, GNF 16px, dark', () => {
    const r = rule('.config-prompt');
    assert.ok(/border:\s*2px solid/.test(r), '2px border');
    assert.ok(!/border-radius/.test(r), 'no radius');
    assert.ok(/font-family:\s*'GNF'/.test(r), 'GNF font');
    assert.ok(/font-size:\s*16px/.test(r), '16px');
    assert.ok(/line-height:\s*24px/.test(r), 'whole-pixel line box');
    assert.ok(!/background:\s*#fff3cd/i.test(r), 'no light box');
});

test('selected sprite card: hard ring, SELECTED tag in GNF 16/24 sits in a reserved strip, not on the image', () => {
    const r = rule('.sprite-card.selected');
    assert.ok(/box-shadow:\s*0 0 0 2px #00ff00/.test(r), 'hard 2px ring');
    const a = rule('.sprite-card.selected::after');
    assert.ok(/content:\s*'SELECTED'/.test(a), 'SELECTED tag');
    assert.ok(/font-family:\s*'GNF'/.test(a) && /font-size:\s*16px/.test(a) && /line-height:\s*24px/.test(a), 'GNF 16/24');
    // strip: tag occupies bottom..bottom+24 and the image ends at padding-bottom; require image clear of the tag
    for (const [sel, tagSel] of [['.sprite-card:not(.invalid)', '.sprite-card.selected::after'], ['.shell-picker .sprite-card:not(.invalid)', '.shell-picker .sprite-card.selected::after']]) {
        const pad = parseFloat((rule(sel).match(/padding-bottom:\s*(\d+)px/) || [])[1]);
        const tagBottom = parseFloat((rule(tagSel).match(/bottom:\s*(\d+)px/) || [])[1]);
        assert.ok(pad >= tagBottom + 24, sel + ' reserves the tag strip: padding-bottom ' + pad + ' vs tag top ' + (tagBottom + 24));
    }
    assert.ok(/background:\s*var\(--ui-accent\)/.test(rule('.shell-picker .sprite-card.selected::after')), 'shell tag uses the accent');
});

test('shell picker: Locked summary focus shows an outline, and the pick pane pads the ring clear of its scroller', () => {
    const f = rule('.shell-picker .pk-locked summary:focus-visible');
    assert.ok(/outline:\s*2px solid/.test(f) && !/outline:\s*none/.test(f), 'Locked summary focus outline');
    assert.ok(/outline-offset:\s*2px/.test(f), 'outline offset');
    const p = rule('.shell-picker .pk-pick');
    assert.ok(/padding:\s*2px 6px 2px 2px/.test(p), 'pick pane padding keeps the 2px ring unclipped');
});

test('.form-control:focus has a hard 2px offset outline, no blur', () => {
    for (const sel of ['.form-control:focus', '.shell-picker .form-control:focus']) {
        const r = rule(sel);
        assert.ok(/outline:\s*2px solid\s+(#00ff00|var\(--ui-accent\))/.test(r), sel + ' 2px solid outline');
        assert.ok(/outline-offset:\s*2px/.test(r), sel + ' offset');
        assert.ok(/box-shadow:\s*none/.test(r), sel + ' no box-shadow glow');
    }
});

test('no blurred shadows on the sheet, and the shell page neutralises the ui-themes.css glow tokens', () => {
    const bad = blurredDecls(rules);
    assert.ok(bad.length === 0, 'blurred: ' + bad.join(' | '));
    // ui-themes.css is shared and loaded in shell mode: its glow tokens are overridden on .shell-picker
    const sp = rule('.shell-picker');
    assert.ok(/--ui-text-glow:\s*none/.test(sp), 'text glow token off');
    assert.ok(/--ui-glow-filter:\s*brightness\(1\)/.test(sp), 'glow filter token off');
    const themes = parseRules(readFileSync(join(root, 'public/break_escape/css/ui-themes.css'), 'utf8'));
    const themeTokens = blurredDecls(themes.filter(r => r.body.includes('--ui-glow-filter') || r.body.includes('--ui-text-glow')));
    assert.ok(themeTokens.length > 0, 'sanity: the scanner does see the themes blurred tokens (so the override is needed)');
    // the shell rules that consume the tokens
    assert.ok(/outline:\s*2px solid var\(--ui-accent\)/.test(rule('.shell-picker .btn:focus-visible')), 'button focus is a hard outline');
    assert.ok(!/glow-filter/.test(rule('.shell-picker .btn:focus-visible')), 'no glow filter on focus-visible');
    // scanner self-check on multi-line / multi-shadow / drop-shadow forms
    assert.ok(blurIn('box-shadow', '0 0 0 2px #0f0,\n 0 0 .5px red') === true, 'catches second shadow');
    assert.ok(blurIn('text-shadow', '0 0 6px currentColor') === true, 'catches text-shadow');
    assert.ok(blurIn('filter', 'brightness(1.2) drop-shadow(0 0 4px rgba(1,2,3,.5))') === true, 'catches drop-shadow');
    assert.ok(blurIn('box-shadow', '0 0 0 2px #00ff00') === false, 'hard ring passes');
});
