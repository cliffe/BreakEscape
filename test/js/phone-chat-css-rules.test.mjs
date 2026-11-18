// Stylesheet rules for the phone-chat CSS: landscape layout (A2), no gradients or blur (A6),
// GNF only on the 8px grid (A7). Reads the CSS file, no browser.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(here, '../../public/break_escape/css/phone-chat-minigame.css');
const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

let pass = 0;
function check(name, fn) {
    try { fn(); pass++; console.log('ok   ' + name); }
    catch (e) { console.error('FAIL ' + name + '\n  ' + e.message); process.exitCode = 1; }
}

// Flat rule list: every {selector, body, media} including those inside @media blocks.
function rules(src, media = '') {
    const out = [];
    let i = 0;
    while (i < src.length) {
        const open = src.indexOf('{', i);
        if (open < 0) break;
        const head = src.slice(i, open).trim();
        let depth = 1, j = open + 1;
        while (j < src.length && depth) { if (src[j] === '{') depth++; else if (src[j] === '}') depth--; j++; }
        const inner = src.slice(open + 1, j - 1);
        if (head.startsWith('@media')) out.push(...rules(inner, head));
        else if (!head.startsWith('@')) out.push({ selector: head, body: inner, media });
        i = j;
    }
    return out;
}
const all = rules(css);

check('stylesheet parses into rules', () => assert.ok(all.length > 100));

// A7: GNF on the 8px grid from 16px.
check('every GNF font-size is 16, 24, 32 ... px', () => {
    const bad = [];
    for (const r of all) {
        const m = r.body.match(/font-size:\s*([^;]+);/);
        if (!m) continue;
        const fam = r.body.match(/font-family:\s*([^;]+);/);
        if (fam && /VT323|Press Start/i.test(fam[1])) continue;
        const px = m[1].trim().match(/^(\d+(?:\.\d+)?)px$/);
        if (!px || Number(px[1]) < 16 || Number(px[1]) % 8 !== 0) bad.push(`${r.selector} { font-size: ${m[1]} }`);
    }
    assert.deepEqual(bad, []);
});
check('small labels moved to VT323', () => {
    for (const sel of ['.message-time', '.message-sender', '.contact-time', '.unread-badge']) {
        const r = all.find(x => x.selector === sel);
        assert.match(r.body, /font-family:\s*'VT323'/, sel);
    }
});

// A6: no blur, no smooth gradients.
check('no shadow has a blur radius', () => {
    const bad = [];
    for (const r of all) {
        for (const m of r.body.matchAll(/(box-shadow|text-shadow|drop-shadow)\s*:?\s*([^;]+);/g)) {
            if (/^none$/.test(m[2].trim())) continue;
            // Split on top-level commas (colour functions contain commas).
            const layers = m[2].split(/,(?![^(]*\))/);
            for (const layer of layers) {
                const lens = layer.replace(/(rgba?|color-mix|hsla?)\([^)]*(\([^)]*\)[^)]*)*\)/g, '').replace(/inset|var\([^)]*\)/g, '').trim().split(/\s+/).filter(Boolean);
                if (lens.length >= 3 && parseFloat(lens[2]) !== 0) bad.push(`${r.selector}: ${layer.trim()}`);
            }
        }
        if (/blur\(/.test(r.body)) bad.push(`${r.selector}: blur()`);
    }
    assert.deepEqual(bad, []);
});
check('only hard-stop repeating-linear-gradient scanlines remain', () => {
    const grads = [...css.matchAll(/([a-z-]*gradient)\(/g)].map(m => m[1]);
    assert.ok(grads.every(g => g === 'repeating-linear-gradient'), grads.join(','));
    const m = css.match(/repeating-linear-gradient\(([\s\S]*?)\);/);
    assert.ok(m, 'scanline gradient present');
    const stops = m[1].split(/,(?![^(]*\))/).map(s => s.trim()).slice(1);
    // transparent 0..2, band 2..4: each band's end equals the next band's start, no soft ramp.
    // transparent, transparent 2px, band 2px, band 4px: the colour changes where the position repeats.
    const pos = stops.map(s => { const p = s.match(/(\d+)px$/); return p ? Number(p[1]) : 0; });
    assert.equal(pos[1], pos[2], 'hard edge between the clear and the band');
    assert.ok(stops[1].startsWith('transparent') && !stops[2].startsWith('transparent'));
});

// A2: phone landscape (max-height 500px).
const land = all.filter(r => /max-height:\s*500px/.test(r.media));
const L = sel => land.find(r => r.selector.replace(/\s+/g, ' ') === sel);
check('landscape: thread keeps at least 56px and scrolls', () => {
    const r = L('.conversation-view .messages-container');
    assert.ok(r, 'rule present');
    assert.ok(parseInt(r.body.match(/min-height:\s*(\d+)px/)[1], 10) >= 56);
    assert.match(r.body, /overflow-y:\s*auto/);
});
check('landscape: replies scroll, shrink and are capped', () => {
    const r = L('.conversation-view .choices-container');
    assert.match(r.body, /overflow-y:\s*auto/);
    assert.match(r.body, /flex-shrink:\s*1/);
    assert.ok(parseInt(r.body.match(/min-height:\s*(\d+)px/)[1], 10) >= 110);
    assert.match(r.body, /max-height:\s*(\d+)vh/);
    assert.ok(parseInt(r.body.match(/max-height:\s*(\d+)vh/)[1], 10) <= 40);
});
check('landscape: reply buttons stay 16px GNF with tight padding', () => {
    const r = L('.conversation-view .choice-button');
    assert.match(r.body, /font-size:\s*16px/);
});
check('portrait and desktop thread/reply base rules unchanged', () => {
    const base = all.filter(r => r.media === '');
    assert.match(base.find(r => r.selector === '.conversation-view .messages-container').body, /min-height:\s*96px/);
    assert.match(base.find(r => r.selector === '.conversation-view .choices-container').body, /min-height:\s*64px/);
    assert.match(base.find(r => r.selector === '.choices-container').body, /max-height:\s*200px/);
});


// Review R1 (M1, M2, M3, m1, n1)
const num = (body, re) => parseInt(body.match(re)[1], 10);
const phoneHeaderPad = 4 * 2 + 30;       // 4px padding top and bottom around a 30px row = 38
const chatHeaderRow = 36;                 // back button row with a 32px headshot
const cueH = 29;
check('landscape budget: two two-line replies fit, with and without the more cue', () => {
    const th = num(L('.conversation-view .messages-container').body, /min-height:\s*(\d+)px/);
    const re = num(L('.conversation-view .choices-container').body, /min-height:\s*(\d+)px/);
    const thCue = num(land.find(r => /^\.conversation-view:has\(\.choices-more-cue\.visible\) \.messages-container$/.test(r.selector)).body, /min-height:\s*(\d+)px/);
    assert.ok(re >= 110, 'replies minimum shows two two-line replies');
    assert.ok(phoneHeaderPad + chatHeaderRow + th + re <= 253, 'without cue');
    assert.ok(phoneHeaderPad + chatHeaderRow + thCue + re + cueH <= 253, 'with cue');
});
check('landscape: phone status header padding trimmed', () => {
    assert.match(L('.phone-header').body, /padding-top:\s*4px/);
});
check('landscape SE chats: legend hidden, budget with and without the cue', () => {
    assert.match(L('.conversation-header .ib-infl-legend').body, /display:\s*none/);
    const seHeader = 90;
    const th = num(L('.conversation-view:has(.se-chat-header) .messages-container').body, /min-height:\s*(\d+)px/);
    const re = num(L('.conversation-view:has(.se-chat-header) .choices-container').body, /min-height:\s*(\d+)px/);
    const thCue = num(L('.conversation-view:has(.se-chat-header):has(.choices-more-cue.visible) .messages-container').body, /min-height:\s*(\d+)px/);
    assert.ok(phoneHeaderPad + seHeader + th + re <= 253);
    assert.ok(phoneHeaderPad + seHeader + thCue + re + cueH <= 253);
});
check('landscape: headshot shrinks to 32px outside call mode; call mode keeps its portrait', () => {
    const r = land.find(x => /:not\(\.phone-call-mode\) \.conversation-header \.conversation-avatar,/.test(x.selector));
    assert.ok(r, 'scoped rule');
    assert.match(r.body, /width:\s*32px/);
    assert.ok(!land.some(x => /display:\s*none/.test(x.body) && /conversation-avatar/.test(x.selector)), 'avatar never hidden');
    const call = all.find(x => x.media === '' && x.selector.startsWith('.phone-call-mode .conversation-avatar'));
    assert.match(call.body, /width:\s*128px/);
});
check('terminal status line fits 246px (26 chars of VT323 18px plus spacing)', () => {
    const r = all.find(x => x.selector === '.phone-terminal-theme .phone-header::after');
    const em = parseFloat(r.body.match(/letter-spacing:\s*([\d.]+)em/)[1]);
    assert.ok(26 * (18 * 0.5 + 18 * em) <= 246);
});
check('no box-shadow ring on the clipped phone shell', () => {
    for (const sel of ['.phone-terminal-theme', '.phone-social-theme']) {
        const r = all.find(x => x.selector === sel);
        assert.doesNotMatch(r.body, /box-shadow/, sel);
    }
});

console.log(`${pass} checks passed`);
