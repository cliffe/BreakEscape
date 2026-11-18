// Voiced call mode in phone landscape (max-height 500px, the 844x390 budget): the status bar,
// header, thread, replies and the end-call button all fit the 253px phone screen, the end-call
// button stays visible, and portrait/desktop call rules are untouched. Reads the CSS, no browser.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const here = path.dirname(fileURLToPath(import.meta.url));
const css = readFileSync(path.join(here, '../../public/break_escape/css/phone-chat-minigame.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

let pass = 0;
function check(name, fn) {
    try { fn(); pass++; console.log('ok   ' + name); }
    catch (e) { console.error('FAIL ' + name + '\n  ' + e.message); process.exitCode = 1; }
}
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
        else if (!head.startsWith('@')) out.push({ selector: head.replace(/\s+/g, ' '), body: inner, media });
        i = j;
    }
    return out;
}
const all = rules(css);
const land = all.filter(r => /max-height:\s*500px/.test(r.media));
const V = '.phone-call-mode #conversation-view';
const L = sel => { const r = land.find(x => x.selector.split(', ').includes(V + ' ' + sel)); assert.ok(r, 'landscape rule ' + sel); return r; };
const px = (body, prop) => parseFloat(body.match(new RegExp('(?:^|[\\s;])' + prop + ':\\s*([\\d.]+)px'))[1]);

const phoneHeader = 4 * 2 + 2 + 28;                       // 38
// The shell is min(700, max(70vh, 100vh - 125)) less 20px of screen margin
const screenAt = vh => Math.round((Math.min(700, Math.max(0.7 * vh, vh - 125)) - 20) * 100) / 100;
const SCREENS = [[390, 253], [375, 242.5], [360, 232]];
const status = L('.call-status-bar');
const statusH = px(status.body, 'height');
const avatarRule = L('.conversation-avatar');
const hdr = L('.conversation-header');
const pads = hdr.body.match(/padding:\s*(\d+)px/);
const headerH = 2 * Number(pads[1]) + px(avatarRule.body, 'height') + 2 * px(avatarRule.body, 'border-width');
const thread = L('.messages-container');
const threadH = px(thread.body, 'height');
const replies = L('.choices-container');
const repliesMin = px(replies.body, 'min-height');
const cueH = 2 + 2 + 2 + 19;                              // landscape cue
const LH = (has, rest) => { const r = land.find(x => x.selector.split(', ').includes(V + has + ' ' + rest)); assert.ok(r, 'landscape rule ' + has + ' ' + rest); return r; };
const CUE = ':has(.choices-more-cue.visible)', SE = ':has(.se-chat-header)', SPEAK = ':has(.choices-container:empty)';
const threadCue = px(LH(CUE, '.messages-container').body, 'height');
check('landscape call: stack fits every phone screen height (253, 242.5, 232), with and without the cue', () => {
    assert.deepEqual(SCREENS.map(([vh]) => screenAt(vh)), [253, 242.5, 232]);
    assert.equal(statusH, 36);
    assert.equal(headerH, 40);
    assert.equal(threadH, 44);
    for (const [vh, screen] of SCREENS) {
        const plain = phoneHeader + statusH + headerH + threadH + repliesMin;
        const cue = phoneHeader + statusH + headerH + threadCue + repliesMin + cueH;
        assert.ok(plain <= screen, `${vh}: no cue ${plain} > ${screen}`);
        assert.ok(cue <= screen, `${vh}: cue ${cue} > ${screen}`);
    }
    assert.ok(threadCue >= 24, 'one subtitle line (2 border + 20.8)');
});
check('landscape call: speaking state (no replies) gives the thread the free height', () => {
    const r = LH(SPEAK, '.messages-container');
    assert.match(r.body, /flex:\s*1 1 auto/);
    assert.match(r.body, /height:\s*auto/);
    assert.match(r.body, /max-height:\s*none/);
    const order = land.map(x => x.selector);
    assert.ok(order.indexOf(V + SPEAK + ' .messages-container') > order.indexOf(V + SE + ' .messages-container'));
    assert.ok(order.indexOf(V + SPEAK + ' .messages-container') > order.indexOf(V + CUE + ' .messages-container'));
});
check('landscape call: influence-bar header wraps to a second row and fits every screen', () => {
    assert.match(LH(SE, '.conversation-header').body, /flex-wrap:\s*wrap/);
    const rowGap = px(LH(SE, '.conversation-header').body, 'row-gap');
    const seHeader = 2 * Number(pads[1]) + 36 + rowGap + 30;   // 2 + 2, row 36, row-gap, 30px bar
    assert.ok(seHeader <= 80, String(seHeader));
    const seThread = px(LH(SE, '.messages-container').body, 'height');
    const seCue = px(LH(SE + CUE, '.choices-container').body, 'min-height');
    for (const [vh, screen] of SCREENS) {
        const total = phoneHeader + statusH + seHeader + seThread + seCue + cueH;
        assert.ok(total <= screen, `${vh}: SE with cue ${total} > ${screen}`);
    }
    assert.ok(seCue >= 35, 'at least one one-line reply (35.2) at the smallest screen');
    assert.ok(phoneHeader + statusH + seHeader + seThread + repliesMin <= 253, 'no cue at 253');
});
check('landscape call: only the latest call-subtitle shows; tells cannot hide it; narrator stays dimmed', () => {
    const hide = land.find(x => x.selector.includes(':not(.call-subtitle)'));
    assert.ok(hide && /display:\s*none/.test(hide.body));
    assert.ok(hide.selector.includes('.call-subtitle:has(~ .call-subtitle)'));
    assert.ok(!land.some(x => x.selector.includes(V) && /:last-child|:nth-last-child/.test(x.selector) && /display:\s*none/.test(x.body)), 'no :last-child hiding');
    assert.match(L('.messages-container > .call-subtitle.narrator').body, /opacity:\s*0\.75/);
});
check('landscape call: caption and DM handle stay in the accessibility tree; name ellipsises', () => {
    const r = land.find(x => x.selector.includes(V + ' .call-caption'));
    assert.ok(r && r.selector.includes(V + ' .npc-handle'));
    assert.match(r.body, /clip:\s*rect\(0 0 0 0\)/);
    assert.match(r.body, /position:\s*absolute/);
    assert.doesNotMatch(r.body, /display:\s*none/);
    assert.ok(!land.some(x => x.selector.includes(V) && /call-caption/.test(x.selector) && /display:\s*none/.test(x.body)));
    const n = L('.npc-name');
    assert.match(n.body, /text-overflow:\s*ellipsis/);
    assert.match(n.body, /white-space:\s*nowrap/);
    assert.match(n.body, /overflow:\s*hidden/);
    assert.match(n.body, /font-size:\s*16px/);
});
check('landscape call: replies hold two one-line replies and scroll', () => {
    const oneLine = 2 * 2 + 2 * 3 + 16 * 1.2;             // border + padding + one 16px line = 29.2
    const need = 2 * oneLine + px(replies.body, 'gap') + 2 * px(replies.body, 'padding') + 2; // + border-top 2
    assert.ok(repliesMin >= need, `${repliesMin} < ${need}`);
    assert.match(replies.body, /overflow-y:\s*auto/);
    assert.match(replies.body, /box-sizing:\s*border-box/);
    assert.match(replies.body, /flex:\s*1 1 auto/);
});
check('landscape call: thread is fixed, border-box and scrolls', () => {
    assert.equal(px(thread.body, 'min-height'), threadH);
    assert.equal(px(thread.body, 'max-height'), threadH);
    assert.match(thread.body, /overflow-y:\s*auto/);
});
check('landscape call: end-call is out of the flow, on screen and never hidden', () => {
    const c = L('.call-controls');
    assert.match(c.body, /position:\s*absolute/);
    assert.match(c.body, /top:\s*0/);
    assert.ok(px(c.body, 'height') <= statusH, 'controls fit the status row');
    const b = L('.call-end-button');
    assert.ok(px(b.body, 'width') >= 32 && px(b.body, 'height') >= 32, 'tap target at least 32px');
    assert.ok(px(b.body, 'height') <= statusH);
    assert.match(b.body, /border:\s*2px solid/);
    for (const r of land) {
        if (/call-end|call-controls/.test(r.selector)) assert.doesNotMatch(r.body, /display:\s*none|visibility:\s*hidden|opacity:\s*0\b/, r.selector);
    }
    assert.match(status.body, /padding:\s*0 52px 0 10px/, 'status bar leaves room for the button');
    const f = L('.call-end-button:focus-visible').body;
    assert.match(f, /outline:\s*2px solid #000/);
    assert.match(f, /border-color:\s*#fff/);
    assert.doesNotMatch(f, /blur|box-shadow/);
    assert.ok(px(c.body, 'margin-top') >= 2, 'button sits 2px down so the outer ring is not clipped at the top');
    assert.match(status.body, /white-space:\s*nowrap/);
});
check('landscape call: header is one row; caption folded, speaking bars and avatar kept', () => {
    assert.match(hdr.body, /flex-direction:\s*row/);
    assert.match(hdr.body, /flex-wrap:\s*nowrap/);
    assert.match(L('.call-caption').body, /clip:\s*rect/);
    assert.ok(!/display:\s*none/.test(L('.call-speaking').body));
    assert.ok(!/display:\s*none/.test(avatarRule.body));
    assert.match(avatarRule.body, /width:\s*32px/);
});
check('landscape call: pixel UI rules (no radius, blur or gradient) in the new rules', () => {
    for (const r of land.filter(x => x.selector.includes(V))) {
        assert.doesNotMatch(r.body, /border-radius|blur\(|gradient/, r.selector);
    }
});
check('landscape call rules are all scoped to call mode', () => {
    for (const r of land.filter(x => /call-/.test(x.selector))) {
        assert.ok(r.selector.split(', ').every(s => s.includes('phone-call-mode')), r.selector);
    }
});
check('portrait and desktop call rules are unchanged', () => {
    const base = all.filter(r => r.media === '');
    const B = sel => base.find(r => r.selector === sel).body;
    assert.match(B('.phone-call-mode .conversation-avatar, .phone-call-mode .conversation-avatar-placeholder'), /width:\s*128px/);
    assert.match(B('.phone-call-mode .messages-container'), /min-height:\s*110px/);
    assert.match(B('.phone-call-mode .call-end-button'), /width:\s*60px/);
    assert.match(B('.phone-call-mode .call-end-button'), /height:\s*60px/);
    assert.match(B('.phone-call-mode .call-controls'), /padding:\s*10px 0 14px/);
    assert.match(B('.phone-call-mode .conversation-header'), /padding:\s*16px/);
    assert.match(B('.phone-call-mode .call-status-bar'), /padding:\s*8px 14px/);
    // nothing for call mode lives in the 820px (tablet) block
    assert.ok(!all.some(r => /max-height:\s*820px/.test(r.media) && r.selector.includes('phone-call-mode')));
});

console.log(`\n${pass} checks passed`);
