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
// Heights counted from the CSS: padding and borders included, the thread and replies border-box.
const px = (body, prop) => num(body, new RegExp(prop + ':\\s*(\\d+)px'));
const base = all.filter(r => r.media === '');
const B = sel => base.find(r => r.selector === sel);
const statusHeader = 4 * 2 + 2 + 28;      // padding 4 + 4, border-bottom 2, 28px row = 38
const chatHeaderRow = 32 + 2 * 2;         // 32px headshot plus its 2px border
const chatHeader = 4 * 2 + 2 + chatHeaderRow; // padding 4 + 4, border-bottom 2 = 46
const cueH = 2 + 2 + 2 + 19;              // landscape cue: padding 2 + 2, border-top 2, 19px line = 25
const choicesRule = L('.conversation-view .choices-container');
const buttonRule = L('.conversation-view .choice-button');
const buttonH = 2 * 2 + 3 * 2 + 2 * 16 * 1.2; // border + padding + two 16px lines at 1.2 = 48.4
const repliesNeeded = 2 * buttonH + px(choicesRule.body, 'gap') + 2 * 4 + px(B('.choices-container').body, 'border-top'); // 110.8
const th = r => px(r.body, 'min-height');
const cueSel = ':has(.choices-more-cue.visible)';
check('landscape: thread and replies are border-box', () => {
    assert.match(L('.conversation-view .messages-container').body, /box-sizing:\s*border-box/);
    assert.match(choicesRule.body, /box-sizing:\s*border-box/);
});
check('landscape: button and container sizes give the arithmetic', () => {
    assert.match(buttonRule.body, /padding:\s*3px 10px/);
    assert.match(choicesRule.body, /padding:\s*4px 10px/);
    assert.ok(Math.abs(repliesNeeded - 110.8) < 0.01, String(repliesNeeded));
});
check('landscape budget: two two-line replies fit, with and without the more cue', () => {
    const t = th(L('.conversation-view .messages-container'));
    const re = th(choicesRule);
    const tCue = th(L('.conversation-view' + cueSel + ' .messages-container'));
    assert.ok(re >= repliesNeeded, 'replies minimum holds two two-line replies');
    assert.ok(statusHeader + chatHeader + t + re <= 253, 'without cue: ' + (statusHeader + chatHeader + t + re));
    assert.ok(statusHeader + chatHeader + tCue + re + cueH <= 253, 'with cue: ' + (statusHeader + chatHeader + tCue + re + cueH));
    assert.equal(px(L('.conversation-view .choices-more-cue').body, 'padding'), 2);
});
check('landscape: phone status header padding trimmed', () => {
    assert.match(L('.phone-header').body, /padding-top:\s*4px/);
});
check('landscape SE chats: legend hidden, empty change hidden, one-row bar, budget with and without the cue', () => {
    // visually hidden, still read by screen readers (it is the only text for threshold state)
    assert.match(L('.conversation-header .ib-infl-legend').body, /clip-path:\s*inset\(50%\)/);
    assert.match(L('.conversation-header .ib-infl-legend').body, /position:\s*absolute/);
    assert.match(L('.conversation-header .ib-infl-change:empty').body, /display:\s*none/);
    assert.match(L('.conversation-header .se-chat-header .influence-bar').body, /padding:\s*0 8px/);
    // bar: border 2 + 2, one row = track margin 8 + (12 + 2 + 2) + 2 = 26 (taller than the 22.5 head), padding 0
    const trackM = L('.conversation-header .ib-infl-track').body.match(/margin:\s*(\d+)px \d+px (\d+)px/);
    const bar = 2 * 2 + (Number(trackM[1]) + 12 + 2 * 2 + Number(trackM[2]));
    assert.equal(bar, 30);
    const seHeader = 4 + chatHeaderRow + 4 + bar + 4 + 2;   // padding, row, row-gap, bar, padding, border = 80
    assert.equal(seHeader, 80);
    const t = th(L('.conversation-view:has(.se-chat-header) .messages-container'));
    const re = th(L('.conversation-view:has(.se-chat-header) .choices-container'));
    const tCue = th(L('.conversation-view:has(.se-chat-header)' + cueSel + ' .messages-container'));
    const reCue = th(L('.conversation-view:has(.se-chat-header)' + cueSel + ' .choices-container'));
    assert.ok(statusHeader + seHeader + t + re <= 253, 'no cue: ' + (statusHeader + seHeader + t + re));
    assert.ok(statusHeader + seHeader + tCue + reCue + cueH <= 253, 'cue: ' + (statusHeader + seHeader + tCue + reCue + cueH));
    assert.ok(re >= 100, 'at least one two-line reply and a half');
});
check('landscape social chats: handle hidden, name and View profile share one row, header stays 46px', () => {
    const blk = L('.phone-social-theme:not(.phone-call-mode) .npc-id-block');
    assert.match(blk.body, /flex-direction:\s*row/);
    assert.match(blk.body, /flex-wrap:\s*nowrap/);
    // long names ellipsise: the name and its flex parent can shrink (R4 m1, n1)
    assert.match(L('.phone-social-theme:not(.phone-call-mode) .conversation-info').body, /min-width:\s*0/);
    const nm = L('.phone-social-theme:not(.phone-call-mode) .npc-id-block .npc-name');
    assert.match(nm.body, /min-width:\s*0/);
    assert.match(nm.body, /text-overflow:\s*ellipsis/);
    assert.match(nm.body, /white-space:\s*nowrap/);
    const handle = L('.phone-social-theme:not(.phone-call-mode) .npc-id-block .npc-handle');
    assert.match(handle.body, /clip:\s*rect\(0 0 0 0\)/);
    assert.match(handle.body, /position:\s*absolute/);
    assert.ok(!/display:\s*none/.test(handle.body), 'handle stays in the accessibility tree');
    const link = L('.phone-social-theme:not(.phone-call-mode) .npc-profile-link');
    assert.ok(px(link.body, 'min-height') >= 32, 'profile button keeps a 32px target');
    assert.ok(!/display:\s*none/.test(link.body));
    // header: 4 + 4 padding, 2 border, row = max(36 headshot row, 32 button, 19.2 name) = 36, so 46
    const row = Math.max(chatHeaderRow, px(link.body, 'min-height'), 19.2);
    const socialHeader = 4 * 2 + 2 + row;
    assert.equal(socialHeader, 46);
    const t = th(L('.conversation-view .messages-container'));
    const re = th(choicesRule);
    const tCue = th(L('.conversation-view' + cueSel + ' .messages-container'));
    assert.ok(statusHeader + socialHeader + t + re <= 253, 'no cue: ' + (statusHeader + socialHeader + t + re));
    assert.ok(statusHeader + socialHeader + tCue + re + cueH <= 253, 'cue: ' + (statusHeader + socialHeader + tCue + re + cueH));
});
// Landscape call mode has its own budget, pinned in phone-call-landscape.test.mjs
check('landscape: terminal skip hint sits inside the 36px empty strip', () => {
    const r = L('.phone-terminal-theme .phone-skip-hint');
    const hintH = 4 + 4 + 16 * 1.2;   // border + padding + one 16px line at 1.2 = 27.2
    assert.ok(px(r.body, 'bottom') + hintH <= 36, 'top at ' + (px(r.body, 'bottom') + hintH));
});
check('landscape: an empty reply list takes no room (terminal keeps 36px for the skip hint)', () => {
    const e = L('.conversation-view .choices-container:empty');
    assert.match(e.body, /min-height:\s*0/);
    assert.match(e.body, /padding-top:\s*0/);
    assert.match(e.body, /border-top-width:\s*0/);
    assert.match(L('.phone-terminal-theme .conversation-view .choices-container:empty').body, /min-height:\s*36px/);
    // The empty rule comes after every min-height rule of equal specificity
    const order = land.map(r => r.selector.replace(/\s+/g, ' '));
    assert.ok(order.indexOf('.conversation-view .choices-container:empty') > order.indexOf('.conversation-view:has(.se-chat-header) .choices-container'));
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
    // the cascade winner is the LAST matching rule
    const r = all.filter(x => x.selector === '.phone-terminal-theme .phone-header::after').pop();
    assert.equal(all.filter(x => x.selector === '.phone-terminal-theme .phone-header::after').length, 1);
    const em = parseFloat(r.body.match(/letter-spacing:\s*([\d.]+)em/)[1]);
    assert.ok(26 * (18 * 0.5 + 18 * em) <= 246);
});
check('no box-shadow ring on the clipped phone shell', () => {
    for (const sel of ['.phone-terminal-theme', '.phone-social-theme']) {
        const r = all.find(x => x.selector === sel);
        assert.doesNotMatch(r.body, /box-shadow/, sel);
    }
});

check('no selector block appears twice with an identical body', () => {
    const seen = new Map(), dup = [];
    for (const r of all) {
        const key = r.media + '|' + r.selector.replace(/\s+/g, ' ') + '|' + r.body.replace(/\s+/g, ' ').trim();
        if (seen.has(key)) dup.push(r.selector); else seen.set(key, 1);
    }
    assert.deepEqual(dup, []);
});
check('no @media block repeats a selector', () => {
    for (const m of new Set(all.map(r => r.media))) {
        if (!m) continue;
        const sels = all.filter(r => r.media === m).map(r => r.selector.replace(/\s+/g, ' '));
        assert.equal(new Set(sels).size, sels.length, m);
    }
});

console.log(`${pass} checks passed`);
