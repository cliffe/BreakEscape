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
check('landscape: thread keeps at least 72px and scrolls', () => {
    const r = L('.conversation-view .messages-container');
    assert.ok(r, 'rule present');
    assert.ok(parseInt(r.body.match(/min-height:\s*(\d+)px/)[1], 10) >= 72);
    assert.match(r.body, /overflow-y:\s*auto/);
});
check('landscape: replies scroll, shrink and are capped', () => {
    const r = L('.conversation-view .choices-container');
    assert.match(r.body, /overflow-y:\s*auto/);
    assert.match(r.body, /flex-shrink:\s*1/);
    assert.match(r.body, /min-height:\s*0/);
    assert.match(r.body, /max-height:\s*(\d+)vh/);
    assert.ok(parseInt(r.body.match(/max-height:\s*(\d+)vh/)[1], 10) <= 40);
});
check('landscape: avatar hidden to save header height', () => {
    const r = land.find(x => /conversation-avatar-placeholder/.test(x.selector));
    assert.match(r.body, /display:\s*none/);
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

console.log(`${pass} checks passed`);
